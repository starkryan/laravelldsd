<?php

namespace App\Http\Controllers;

use App\Models\PhoneTransaction;
use App\Services\FiveSimService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OtpController extends Controller
{
    protected FiveSimService $fiveSimService;
    
    public function __construct(FiveSimService $fiveSimService)
    {
        $this->fiveSimService = $fiveSimService;
    }
    
    /**
     * Show the OTP selection page
     */
    public function index()
    {
        $countries = $this->fiveSimService->getCountries();
        
        // Get user's active transactions
        $transactions = Auth::user()->phoneTransactions()
            ->whereIn('status', ['PENDING', 'RECEIVED'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        return Inertia::render('otp/index', [
            'countries' => $countries,
            'transactions' => $transactions,
        ]);
    }
    
    /**
     * Get products for a specific country
     */
    public function getProducts(Request $request)
    {
        $request->validate([
            'country' => 'required|string',
            'operator' => 'nullable|string',
        ]);
        
        $country = $request->input('country');
        $operator = $request->input('operator', 'any');
        
        $products = $this->fiveSimService->getProducts($country, $operator);
        
        return response()->json($products);
    }
    
    /**
     * Get operators for a specific country and product
     */
    public function getPrices(Request $request)
    {
        $request->validate([
            'country' => 'required|string',
            'product' => 'required|string',
        ]);
        
        $country = $request->input('country');
        $product = $request->input('product');
        
        $prices = $this->fiveSimService->getPrices($country, $product);
        
        return response()->json($prices);
    }
    
    /**
     * Purchase a number
     */
    public function purchase(Request $request)
    {
        $request->validate([
            'country' => 'required|string',
            'operator' => 'required|string',
            'product' => 'required|string',
        ]);
        
        $user = Auth::user();
        $country = $request->input('country');
        $operator = $request->input('operator');
        $product = $request->input('product');
        
        $transaction = $this->fiveSimService->purchaseNumber($user, $country, $operator, $product);
        
        if (!$transaction) {
            return back()->with('error', 'Failed to purchase number. Please check your balance or try again.');
        }
        
        return redirect()->route('otp.verify', $transaction->id);
    }
    
    /**
     * Show verification page for a purchased number
     */
    public function verify(PhoneTransaction $transaction)
    {
        // Make sure user owns this transaction
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }
        
        // Update transaction status
        $transaction = $this->fiveSimService->checkStatus($transaction);
        
        return Inertia::render('otp/verify', [
            'transaction' => $transaction,
        ]);
    }
    
    /**
     * Check for SMS updates
     */
    public function checkSms(PhoneTransaction $transaction)
    {
        // Make sure user owns this transaction
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }
        
        // Update transaction status
        $transaction = $this->fiveSimService->checkStatus($transaction);
        
        return response()->json([
            'transaction' => $transaction,
            'has_sms' => !empty($transaction->sms_text),
        ]);
    }
    
    /**
     * Cancel a purchase
     */
    public function cancel(PhoneTransaction $transaction)
    {
        // Make sure user owns this transaction
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }
        
        $result = $this->fiveSimService->cancelPurchase($transaction, Auth::user());
        
        if (!$result) {
            return back()->with('error', 'Failed to cancel the transaction.');
        }
        
        return redirect()->route('otp.index')->with('success', 'Transaction successfully canceled and refunded.');
    }
    
    /**
     * Finish a purchase
     */
    public function finish(PhoneTransaction $transaction)
    {
        // Make sure user owns this transaction
        if ($transaction->user_id !== Auth::id()) {
            abort(403);
        }
        
        $result = $this->fiveSimService->finishPurchase($transaction);
        
        if (!$result) {
            return back()->with('error', 'Failed to finish the transaction.');
        }
        
        return redirect()->route('otp.index')->with('success', 'Transaction successfully finished.');
    }
    
    /**
     * Show history of transactions
     */
    public function history()
    {
        $transactions = Auth::user()->phoneTransactions()
            ->orderBy('created_at', 'desc')
            ->paginate(10);
        
        return Inertia::render('otp/history', [
            'transactions' => $transactions,
        ]);
    }
}
