<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('phone_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('transaction_id')->unique(); // 5sim transaction ID
            $table->string('phone_number');
            $table->string('country');
            $table->string('operator');
            $table->string('service');
            $table->decimal('price', 10, 2);
            $table->string('status'); // PENDING, RECEIVED, CANCELED, FINISHED
            $table->timestamp('expires_at');
            $table->text('sms_text')->nullable();
            $table->timestamp('sms_received_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('phone_transactions');
    }
};
