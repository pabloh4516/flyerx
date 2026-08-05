<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Wallet;

use Illuminate\Foundation\Http\FormRequest;

class CreateDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => [
                'required',
                'numeric',
                'min:' . config('flyerx.deposits.min_amount', 10),
                'max:' . config('flyerx.deposits.max_amount', 50000),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'O valor do depósito é obrigatório.',
            'amount.numeric' => 'O valor deve ser numérico.',
            'amount.min' => 'O valor mínimo para depósito é R$ :min.',
            'amount.max' => 'O valor máximo para depósito é R$ :max.',
        ];
    }
}
