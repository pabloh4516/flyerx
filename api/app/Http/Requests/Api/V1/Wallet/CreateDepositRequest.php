<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Wallet;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request para criar depósito via Eulen Pix2Depix
 */
class CreateDepositRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Valor em reais (será convertido para centavos)
            'amount' => [
                'required',
                'numeric',
                'min:' . config('flyerx.deposits.min_amount', 6),
                'max:' . config('flyerx.deposits.max_amount', 50000),
            ],

            // CPF/CNPJ do pagador (obrigatório pela Eulen)
            'payer_tax_number' => [
                'required',
                'string',
                'min:11',
                'max:14',
                'regex:/^[0-9]+$/',
            ],

            // Endereço Liquid para receber o DePix (opcional)
            'depix_address' => [
                'nullable',
                'string',
                'regex:/^(lq1|ex1)[a-z0-9]{40,}$/i',
            ],

            // EUID do usuário na Eulen (opcional)
            'euid' => [
                'nullable',
                'string',
                'regex:/^EU\d{15}$/',
            ],

            // Endereço para split (comissão do parceiro)
            'split_address' => [
                'nullable',
                'string',
                'regex:/^(lq1|ex1)[a-z0-9]{40,}$/i',
            ],

            // Porcentagem do split (ex: "0.02" para 2%)
            'split_fee' => [
                'nullable',
                'string',
                'regex:/^[0-9]*\.?[0-9]+$/',
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
            'payer_tax_number.required' => 'O CPF/CNPJ do pagador é obrigatório.',
            'payer_tax_number.regex' => 'O CPF/CNPJ deve conter apenas números.',
            'depix_address.regex' => 'Endereço Liquid inválido.',
            'euid.regex' => 'EUID inválido. Formato: EU + 15 dígitos.',
            'split_address.regex' => 'Endereço de split Liquid inválido.',
            'split_fee.regex' => 'Porcentagem de split inválida.',
        ];
    }

    /**
     * Retorna o valor em centavos
     */
    public function getAmountInCents(): int
    {
        return (int) round($this->input('amount') * 100);
    }

    /**
     * Retorna o CPF/CNPJ sem formatação
     */
    public function getPayerTaxNumber(): string
    {
        return preg_replace('/\D/', '', $this->input('payer_tax_number'));
    }
}
