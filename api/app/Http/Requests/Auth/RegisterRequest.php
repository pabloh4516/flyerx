<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email:rfc',
                'max:255',
            ],
            'password' => [
                'required',
                'string',
                Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
                'confirmed',
            ],
            'full_name' => [
                'required',
                'string',
                'min:3',
                'max:255',
            ],
            'tax_number' => [
                'required',
                'string',
                'regex:/^(\d{11}|\d{14}|\d{3}\.\d{3}\.\d{3}-\d{2}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})$/',
            ],
            'phone' => [
                'nullable',
                'string',
                'regex:/^(\+?55)?(\d{10,11})$/',
            ],
            'birth_date' => [
                'nullable',
                'date',
                'before:today',
                'after:1900-01-01',
            ],
            'accept_terms' => [
                'required',
                'accepted',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'O email é obrigatório.',
            'email.email' => 'Informe um email válido.',
            'password.required' => 'A senha é obrigatória.',
            'password.confirmed' => 'A confirmação da senha não confere.',
            'full_name.required' => 'O nome completo é obrigatório.',
            'full_name.min' => 'O nome deve ter pelo menos 3 caracteres.',
            'tax_number.required' => 'O CPF/CNPJ é obrigatório.',
            'tax_number.regex' => 'Informe um CPF ou CNPJ válido.',
            'phone.regex' => 'Informe um telefone válido.',
            'birth_date.before' => 'A data de nascimento deve ser anterior a hoje.',
            'accept_terms.required' => 'Você deve aceitar os termos de uso.',
            'accept_terms.accepted' => 'Você deve aceitar os termos de uso.',
        ];
    }
}
