# CONTINUIDADE — Retrofit Visual Flyerx Web

**Atualizado em:** 2026-08-05 (sessão 2)
**Regra:** Este documento é atualizado ao FIM de cada sessão de trabalho e ao fechar cada grupo/fase. Qualquer sessão ou conversa nova começa lendo: este arquivo → CLAUDE.md (raiz e flyerx-web) → 01-decisoes.md.

---

## Estado atual do fluxo

- [x] Fase 1 — Auditoria (00-auditoria-web.md)
- [x] Fase 2 — Decisões (01-decisoes.md, 14 seções: tokens, pares, radius, spacing, ícones, grid, tipografia D.3, buttons D.2, contraste seção 14)
- [x] Fase 3 — Consolidação da biblioteca (02-consolidacao.md; commits c734667 até 0c5842c; inclui: unificação de pares, sintaxe Tailwind 4 religada, autofill fix, color-scheme dark, auditoria sistêmica de contraste com 7 correções)
- [ ] Fase 4 — Migração de telas:
  - [x] **Grupo A CONCLUÍDO** (receive, send) — commits `98b6fa1` até `9d0c21b`
  - [ ] **Grupo B parte 1** (login, register) — PRÓXIMA SESSÃO
  - [ ] Grupo B parte 2 (forgot-password, verify-email)
  - [ ] Grupos C+D (history, dashboard, pix-keys, payment-links, subaccounts, developers, settings)
- [ ] Fase 5 — QA final em sessão LIMPA, comparando o app contra 01-decisoes.md + CLAUDE.md, incluindo varredura de contraste em todos os estados das telas

---

## Sessão 2 (2026-08-05) — Correções pós-Grupo A

### O que foi feito

1. **Container aplicado em receive e send** (commit `ab7c9dd`)
   - Regra 8.4: Container size="lg" limita largura em monitores largos

2. **AmountInput criado e aplicado** (commit `f858547`)
   - Novo componente: input de valor monetário com prefixo R$ integrado
   - Corrige: fundo claro, spinners visíveis, prefixo desalinhado
   - Aplicado em receive e send

3. **StepsGuide criado e aplicado** (commit `9d0c21b`)
   - Novo componente: bloco "como funciona" com passos em cards
   - Unifica implementações diferentes de receive e send
   - Padrão oficial: versão com cards (01-decisoes.md seção 8.5)
   - Registrado para admin e mobile herdarem

### Pendente para próxima sessão

- **Grupo B parte 1:** login/page.tsx + register/page.tsx
  - Inventário de violações já documentado em 04-migracao-telas.md
  - Aplicar processo: sintaxe [-- → tipografia → spacing → radius → componentes → Container size="sm"
  - ATENÇÃO register: Checkbox com links de Termos/Política usa label ReactNode — preservar links

---

## Verificação visual pendente

O usuário deve verificar ANTES de iniciar a próxima sessão:

1. **receive/page.tsx:**
   - Container limitando largura em monitor largo
   - AmountInput com fundo escuro e spinners ocultos
   - StepsGuide com passos em cards (visual novo)

2. **send/page.tsx:**
   - Container limitando largura em monitor largo
   - AmountInput com fundo escuro e spinners ocultos
   - StepsGuide (já era o visual original, deve estar igual)

3. **/design-system:**
   - AmountInput com todos os estados
   - StepsGuide com exemplo

---

## Aviso técnico crítico (seção 14.3 do 01-decisoes.md)

```
bg-accent / text-accent = accent-900 (ESCURO, #2b2741)
bg-primary / text-primary = vibrante (#9184d9)
```

Para cores vibrantes (CTAs, estados checked) usar **PRIMARY**; accent puro só para fundos de destaque escuro. Este token ambíguo foi a causa raiz de 12 bugs de contraste.

---

## Regras operacionais do processo (imutáveis)

1. **Handoff entre sessões = markdown no repo**, nunca memória de conversa
2. **Documento atualizado ao fim de CADA ação/página** — trabalho não documentado é trabalho perdido
3. **pnpm build a cada mudança**; commit a cada marco; git log antes de refazer qualquer coisa pós-compactação
4. **Visual nunca muda funcionalidade/textos**; achados vão para TODO.md
5. **Biblioteca (components/ui/) só é alterada com decisão explícita** — telas nunca criam variação
6. **Inspeção visual do usuário nos portões** (foi ela que originou a auditoria de contraste)
7. **Backend (api/ e flyerx-backend/) intocável**

---

## Pós-retrofit (backlog acordado)

- Retrofit do flyerx-admin (herda tokens/regras de docs/design/ — mesma stack)
- Retrofit do flyerx-mobile (adapta tokens para NativeWind; specs em 03-layouts.md)
- Criar agentes em .claude/agents/:
  - **design-auditor** — só lê, relata violações
  - **design-executor** — executa conforme docs, ciclo build+doc+commit
  - **design-guardian** — mudanças futuras no design system: avalia impacto, atualiza 01-decisoes.md com justificativa, aplica, mantém docs e código sincronizados
- Repositório GitHub privado para backup off-site
- Passada de microcopy/UX writing (fora do escopo visual)

---

## Commits da consolidação e migração

| Hash | Descrição |
|------|-----------|
| `c734667` | chore: baseline do monorepo Flyerx |
| `45e11c2` | chore(design): finaliza consolidação do design system Nocturne |
| `0b8b3b6` | chore(design): completa showcase e adiciona exports faltantes |
| `bba7b35` | fix(design): corrige swatches, tabs variants, page-header kicker |
| `aee027a` | chore(design): aplica cores semânticas e registra regras de Button/Tipografia |
| `6994961` | fix(design): força tema escuro em controles nativos (color-scheme dark) |
| `0c5842c` | fix(design): auditoria sistêmica de contraste em todos os estados |
| `98b6fa1` | feat(design): migra receive e send para o design system Nocturne (Grupo A) |
| `ab7c9dd` | fix(design): aplica Container conforme regra 8.4 em receive e send |
| `f858547` | feat(design): cria AmountInput e aplica em receive/send |
| `9d0c21b` | feat(design): cria StepsGuide (padrão cards) e unifica bloco como-funciona |

---

*Documento atualizado em 2026-08-05 (sessão 2). Próxima sessão: Grupo B parte 1 (login + register).*
