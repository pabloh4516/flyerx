# Templates de Pagina — Nocturne Design System

**Data:** 2026-08-05
**Fonte de verdade:** 01-decisoes.md + CLAUDE.md do flyerx-web
**Regra:** Toda pagina nova DEVE iniciar copiando um destes esqueletos

---

## Template A — Pagina do App ((main)/)

**Referencia:** receive/page.tsx, send/page.tsx

### Estrutura

```
Container size="lg"
├── PageHeader (icone + kicker + titulo + descricao)
├── Steps (se fluxo multi-step)
├── Grid responsivo (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
│   ├── Card / Form / AmountInput
│   ├── StepsGuide (bloco "como funciona")
│   └── ...
└── Footer (links termos/privacidade)
```

### Esqueleto de codigo

```tsx
'use client';

import { useState } from 'react';
import { SomeIcon } from 'lucide-react';

// Imports SEMPRE de @/components/ui (index centralizado)
import { Button, Card, Input, Container } from '@/components/ui';
import { StepsGuide } from '@/components/ui/steps-guide';

export default function NomeDaPagina() {
  const [step, setStep] = useState(1);

  return (
    <Container size="lg" padded={false} className="p-7 flex flex-col gap-6 min-h-full">
      {/* Header da pagina */}
      <div className="flex items-center gap-4">
        {/* Icon box */}
        <div className="size-12 rounded-lg border border-accent-700 bg-gradient-to-br from-accent-900 to-transparent text-accent-300 flex items-center justify-center">
          <SomeIcon className="size-5" />
        </div>
        {/* Titulo e descricao */}
        <div className="flex-1 flex flex-col gap-0.5">
          <span className="text-xl font-medium">Titulo da Pagina</span>
          <span className="text-xs text-neutral-500">
            Descricao breve da pagina
          </span>
        </div>
        {/* Acoes auxiliares (opcional) */}
        <button className="size-9 rounded-md border border-border flex items-center justify-center text-neutral-400 hover:text-neutral-300 hover:border-neutral-700 transition-colors">
          <HelpCircle className="size-4" />
        </button>
      </div>

      {/* Conteudo principal — grid responsivo */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.85fr] gap-11 items-start">
        {/* Coluna principal */}
        <div className="flex flex-col gap-4">
          {/* Campos, cards, inputs... */}
          <Card>
            {/* Conteudo do card */}
          </Card>

          {/* CTA principal — MAXIMO 1 solid por pagina */}
          <Button variant="solid" size="lg" fullWidth>
            Acao Principal
          </Button>
        </div>

        {/* Coluna lateral (opcional) */}
        <StepsGuide
          headerIcon={Zap}
          title="Como funciona"
          subtitle="Passo a passo"
          steps={[
            { icon: Step1Icon, title: 'Passo 1', description: 'Descricao' },
            { icon: Step2Icon, title: 'Passo 2', description: 'Descricao' },
            { icon: Step3Icon, title: 'Passo 3', description: 'Descricao' },
          ]}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-auto pt-1 text-xs text-neutral-600">
        <span>© 2026 Flyerx</span>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-neutral-400">Privacidade</Link>
          <Link href="/terms" className="hover:text-neutral-400">Termos</Link>
        </div>
      </div>
    </Container>
  );
}
```

### Checklist pre-commit

- [ ] Container `size="lg"` (ou tamanho justificado)
- [ ] Zero valor arbitrario (`[Npx]`, `[--`, `[#hex]`)
- [ ] Componentes SOMENTE de `@/components/ui`
- [ ] Tipografia conforme D.3 (text-xl titulo, text-sm corpo, text-xs label/caption, text-[10px] kicker)
- [ ] Maximo 1 Button `variant="solid"` por pagina
- [ ] Grid responsivo (breakpoints md/lg)
- [ ] Icones Lucide React, tamanhos size-3 a size-6
- [ ] Cores semanticas (text-neutral-*, bg-accent-*, border-divider)

---

## Template B — Pagina de Auth/Formulario ((auth)/)

**Referencia:** login/page.tsx, register/page.tsx, forgot-password/page.tsx, verify-email/page.tsx

### Estrutura

```
div (min-h-screen + flex center + p-6)
├── GlowOrb (decorativo, posicao absoluta)
├── GlowOrb (decorativo, posicao absoluta)
└── Container size="sm"
    ├── Header (logo + titulo + descricao)
    ├── Formulario (labels EXTERNOS + Inputs + CTA solid)
    ├── Links secundarios
    └── Footer de seguranca (icone + texto)
```

### Esqueleto de codigo

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';

// Imports SEMPRE de @/components/ui (index centralizado)
import { Button, Input, Container } from '@/components/ui';
import { GlowOrb } from '@/components/ui/nocturne';

import { mySchema, MyFormData } from '@/lib/validations/...';

export default function NomeDaPagina() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MyFormData>({
    resolver: zodResolver(mySchema),
  });

  const onSubmit = async (data: MyFormData) => {
    setIsLoading(true);
    try {
      // ... logica
      toast.success('Sucesso!');
    } catch {
      toast.error('Erro');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-6">
      {/* Glow orbs decorativos */}
      <GlowOrb
        variant="section"
        size={480}
        className="top-[-180px] left-[-120px] opacity-60"
      />
      <GlowOrb
        variant="accent"
        size={460}
        className="bottom-[-220px] right-[-140px] opacity-70"
      />

      <Container size="sm" padded={false} className="relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-3.5 mb-8">
          {/* Logo box */}
          <div className="size-14 rounded-lg border border-accent-700 bg-gradient-to-br from-accent-900 to-transparent flex items-center justify-center text-xl font-semibold glow-accent">
            <span>f</span>
            <span className="text-primary">x</span>
          </div>

          {/* Titulo e descricao */}
          <div className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-medium tracking-[-0.02em] leading-[1.15]">
              Titulo da Pagina
            </h1>
            <p className="text-sm text-neutral-500 leading-[1.5]">
              Descricao breve do que essa pagina faz
            </p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* Campo com LABEL EXTERNO */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-neutral-500">Nome do Campo</label>
            <Input
              type="text"
              placeholder="placeholder..."
              {...register('campo')}
              disabled={isLoading}
            />
            {errors.campo && (
              <p className="text-xs text-destructive">{errors.campo.message}</p>
            )}
          </div>

          {/* Campo com label + acao secundaria */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-neutral-500">Senha</label>
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Esqueceu?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
          </div>

          {/* CTA principal — UNICO solid da pagina */}
          <Button
            type="submit"
            variant="solid"
            size="lg"
            fullWidth
            disabled={isLoading}
            className="h-12 text-base mt-2"
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Texto do Botao
          </Button>

          {/* Link secundario (opcional) */}
          <Link href="/outra-pagina" className="w-full">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              fullWidth
              className="h-12 text-neutral-400 hover:text-neutral-300"
            >
              Texto do link
            </Button>
          </Link>
        </form>

        {/* Footer de seguranca */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-600 mt-8">
          <Shield className="size-3" />
          <span>Seus dados estao protegidos com criptografia</span>
        </div>
      </Container>
    </div>
  );
}
```

### Checklist pre-commit

- [ ] Container `size="sm"` (672px max)
- [ ] Centralizado verticalmente (`min-h-screen flex items-center justify-center`)
- [ ] GlowOrbs decorativos (posicao absoluta com valores negativos — excecao valida)
- [ ] Zero valor arbitrario no resto (`[Npx]`, `[--`, `[#hex]`)
- [ ] Componentes SOMENTE de `@/components/ui`
- [ ] Labels EXTERNOS em todos os campos (`text-xs text-neutral-500` acima do Input)
- [ ] Gap entre campos: `gap-4` ou `gap-3.5`
- [ ] Gap label→input: `gap-2`
- [ ] Tipografia D.3 (text-2xl titulo, text-sm descricao, text-xs label/erro, text-[10px] footer)
- [ ] Maximo 1 Button `variant="solid"` por pagina
- [ ] Footer de seguranca (Shield icon + texto)
- [ ] Altura uniforme de campos (Input padrao, h-10)

---

## Excecoes documentadas

| Valor arbitrario | Contexto | Justificativa |
|------------------|----------|---------------|
| `top-[-180px]`, `right-[-60px]`, etc. | GlowOrb | Posicionamento absoluto de elemento decorativo |
| `size-[72px]` | Icon circle grande | Tamanho especifico para proporção visual |
| `w-[210px] h-[210px]` | QR Code | Dimensão funcional do QR |
| `grid-cols-[1fr_0.85fr]` | Grid proporcional | Layout especifico justificado |
| `text-[10px]` | Kicker/footer | Tamanho padrao para eyebrow (D.3) |

---

*Documento criado em 2026-08-05. Templates extraidos das 6 paginas migradas (receive, send, login, register, forgot-password, verify-email).*
