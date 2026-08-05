<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Wallet;

use App\Domain\Wallet\Enums\PixKeyType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateWithdrawalRequest extends FormRequest
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
                'min:' . config('flyerx.withdrawals.min_amount', 10),
                'max:' . config('flyerx.withdrawals.max_amount', 10000),
            ],
            'pix_key_type' => [
                'required',
                'string',
                Rule::in(array_column(PixKeyType::cases(), 'value')),
            ],
            'pix_key' => [
                'required',
                'string',
                'max:255',
            ],
            'recipient_name' => [
                'nullable',
                'string',
                'max:255',
            ],
            'recipient_document' => [
                'nullable',
                'string',
                'max:20',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'O valor do saque é obrigatório.',
            'amount.numeric' => 'O valor deve ser numérico.',
            'amount.min' => 'O valor mínimo para saque é R$ :min.',
            'amount.max' => 'O valor máximo para saque é R$ :max.',
            'pix_key_type.required' => 'O tipo da chave PIX é obrigatório.',
            'pix_key_type.in' => 'Tipo de chave PIX inválido.',
            'pix_key.required' => 'A chave PIX é obrigatória.',
            'pix_key.max' => 'A chave PIX é muito longa.',
        ];
    }
}
