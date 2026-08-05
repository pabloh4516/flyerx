<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
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
                'email',
            ],
            'password' => [
                'required',
                'string',
            ],
            'device_fingerprint' => [
                'nullable',
                'string',
                'max:255',
            ],
            'device_name' => [
                'nullable',
                'string',
                'max:100',
            ],
            'device_platform' => [
                'nullable',
                'string',
                'in:ios,android,web',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'O email é obrigatório.',
            'email.email' => 'Informe um email válido.',
            'password.required' => 'A senha é obrigatória.',
        ];
    }
}
