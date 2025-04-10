<?php

use App\Http\Controllers\OtpController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Services\FiveSimService;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $fiveSimService = new FiveSimService();
        $countries = $fiveSimService->getCountries();
        $transactions = auth()->user()->phoneTransactions()->latest()->take(5)->get();
        
        return Inertia::render('dashboard', [
            'countries' => $countries,
            'transactions' => $transactions
        ]);
    })->name('dashboard');
    
    // OTP Routes
    Route::prefix('otp')->name('otp.')->group(function () {
        Route::get('/', [OtpController::class, 'index'])->name('index');
        Route::post('/products', [OtpController::class, 'getProducts'])->name('products');
        Route::post('/prices', [OtpController::class, 'getPrices'])->name('prices');
        Route::post('/purchase', [OtpController::class, 'purchase'])->name('purchase');
        Route::get('/verify/{transaction}', [OtpController::class, 'verify'])->name('verify');
        Route::post('/check-sms/{transaction}', [OtpController::class, 'checkSms'])->name('check-sms');
        Route::post('/cancel/{transaction}', [OtpController::class, 'cancel'])->name('cancel');
        Route::post('/finish/{transaction}', [OtpController::class, 'finish'])->name('finish');
        Route::get('/history', [OtpController::class, 'history'])->name('history');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
