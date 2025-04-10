<?php

namespace App\Services;

use App\Models\PhoneTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FiveSimService
{
    protected string $apiKey;
    protected string $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.fivesim.api_key');
        $this->apiUrl = config('services.fivesim.api_url');
    }

    /**
     * Get list of all available countries
     * 
     * @return array
     */
    public function getCountries(): array
    {
        try {
            $response = Http::get("{$this->apiUrl}/guest/countries");
            
            if ($response->successful() && !empty($response->json())) {
                return $response->json();
            }
            
            Log::warning('5sim API returned empty countries list or unsuccessful response');
            return $this->getFallbackCountries();
        } catch (RequestException $e) {
            Log::error('Failed to fetch countries from 5sim: ' . $e->getMessage(), [
                'api_url' => $this->apiUrl,
                'status_code' => $e->getCode()
            ]);
            return $this->getFallbackCountries();
        } catch (\Exception $e) {
            Log::error('Unexpected error fetching countries from 5sim: ' . $e->getMessage());
            return $this->getFallbackCountries();
        }
    }
    
    /**
     * Provide fallback countries if API fails
     * 
     * @return array
     */
    private function getFallbackCountries(): array
    {
        return [
            'usa' => 'United States',
            'canada' => 'Canada',
            'uk' => 'United Kingdom',
            'germany' => 'Germany',
            'france' => 'France',
            'india' => 'India',
            'australia' => 'Australia',
            'brazil' => 'Brazil',
            'japan' => 'Japan',
            'china' => 'China',
            'russia' => 'Russia',
            'mexico' => 'Mexico',
            'indonesia' => 'Indonesia',
            'netherlands' => 'Netherlands',
            'spain' => 'Spain'
        ];
    }

    /**
     * Get list of available products for a country
     * 
     * @param string $country
     * @param string $operator
     * @return array
     */
    public function getProducts(string $country, string $operator = 'any'): array
    {
        try {
            $response = Http::get("{$this->apiUrl}/guest/products/{$country}/{$operator}");
            return $response->json();
        } catch (RequestException $e) {
            Log::error("Failed to fetch products for country {$country}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Get prices for a specific product in a country
     * 
     * @param string $country
     * @param string $product
     * @return array
     */
    public function getPrices(string $country, string $product): array
    {
        try {
            $response = Http::get("{$this->apiUrl}/guest/prices", [
                'country' => $country,
                'product' => $product
            ]);
            return $response->json();
        } catch (RequestException $e) {
            Log::error("Failed to fetch prices for {$product} in {$country}: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Purchase a phone number for a specific service
     * 
     * @param User $user
     * @param string $country
     * @param string $operator
     * @param string $product
     * @return PhoneTransaction|null
     */
    public function purchaseNumber(User $user, string $country, string $operator, string $product): ?PhoneTransaction
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->apiUrl}/user/buy/activation/{$country}/{$operator}/{$product}");
            
            $data = $response->json();
            
            // Check if user has enough balance
            if ($user->balance < $data['price']) {
                return null;
            }
            
            // Create transaction record
            $transaction = new PhoneTransaction([
                'user_id' => $user->id,
                'transaction_id' => $data['id'],
                'phone_number' => $data['phone'],
                'country' => $data['country'],
                'operator' => $data['operator'],
                'service' => $data['product'],
                'price' => $data['price'],
                'status' => $data['status'],
                'expires_at' => Carbon::parse($data['expires']),
                'sms_text' => null,
                'sms_received_at' => null,
            ]);
            
            $transaction->save();
            
            // Deduct the price from user balance
            $user->balance -= $data['price'];
            $user->save();
            
            return $transaction;
        } catch (RequestException $e) {
            Log::error("Failed to purchase number for {$product} in {$country}: " . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Check status of a transaction and update if SMS received
     * 
     * @param PhoneTransaction $transaction
     * @return PhoneTransaction
     */
    public function checkStatus(PhoneTransaction $transaction): PhoneTransaction
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->apiUrl}/user/check/{$transaction->transaction_id}");
            
            $data = $response->json();
            
            // Update status
            $transaction->status = $data['status'];
            
            // Check if SMS is received
            if (!empty($data['sms']) && is_array($data['sms']) && count($data['sms']) > 0) {
                $lastSms = end($data['sms']);
                $transaction->sms_text = $lastSms['text'];
                $transaction->sms_received_at = Carbon::parse($lastSms['created_at']);
                $transaction->status = 'RECEIVED';
            }
            
            $transaction->save();
            
            return $transaction;
        } catch (RequestException $e) {
            Log::error("Failed to check status for transaction {$transaction->transaction_id}: " . $e->getMessage());
            return $transaction;
        }
    }
    
    /**
     * Cancel a purchase and refund the balance
     * 
     * @param PhoneTransaction $transaction
     * @param User $user
     * @return bool
     */
    public function cancelPurchase(PhoneTransaction $transaction, User $user): bool
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->apiUrl}/user/cancel/{$transaction->transaction_id}");
            
            $data = $response->json();
            
            if (isset($data['status']) && $data['status'] === 'CANCELED') {
                // Refund the user
                $user->balance += $transaction->price;
                $user->save();
                
                // Update the transaction
                $transaction->status = 'CANCELED';
                $transaction->save();
                
                return true;
            }
            
            return false;
        } catch (RequestException $e) {
            Log::error("Failed to cancel transaction {$transaction->transaction_id}: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Finish a purchase
     * 
     * @param PhoneTransaction $transaction
     * @return bool
     */
    public function finishPurchase(PhoneTransaction $transaction): bool
    {
        try {
            $response = Http::withToken($this->apiKey)
                ->get("{$this->apiUrl}/user/finish/{$transaction->transaction_id}");
            
            $data = $response->json();
            
            if (isset($data['status']) && $data['status'] === 'FINISHED') {
                $transaction->status = 'FINISHED';
                $transaction->save();
                
                return true;
            }
            
            return false;
        } catch (RequestException $e) {
            Log::error("Failed to finish transaction {$transaction->transaction_id}: " . $e->getMessage());
            return false;
        }
    }
} 