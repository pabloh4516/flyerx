# Auditoria Completa — flyerx-web (Nocturne Design System)

**Data:** 2026-08-05
**Escopo:** Componentes de UI, páginas, layouts e valores visuais hardcoded

---

## 1. FOUNDATIONS (Identidade Visual)

| Item | Status | Observação |
|------|--------|------------|
| **Cores** | OK | Paleta completa definida em `globals.css` (accent, neutral, semantic) |
| **Tipografia** | OK | Fonte Inter, escalas definidas (`text-[14px]`, etc.) |
| **Espaçamento** | PARCIAL | Tokens `--space-*` existem mas NÃO são usados nas páginas |
| **Radius** | OK | `--radius-sm/md/lg/xl/full` definidos e usados via `rounded-[--radius-*]` |
| **Shadows** | OK | `--shadow-sm/md/lg/glow` definidos |
| **Ícones** | FALTA | Nenhum padrão documentado (tamanhos, stroke, biblioteca) |
| **Grid/Layout** | FALTA | Nenhum sistema de grid documentado |

---

## 2. BIBLIOTECA DE COMPONENTES

### Componentes Existentes

| Componente | Arquivo | Usando Tokens? |
|------------|---------|----------------|
| Button | button.tsx | SIM |
| Input | input.tsx | SIM |
| Textarea | textarea.tsx | SIM |
| Select (Base UI) | select.tsx | SIM |
| Select Native | select-native.tsx | SIM |
| Checkbox (Base UI) | checkbox.tsx | SIM |
| Checkbox Custom | checkbox-custom.tsx | SIM |
| Radio Custom | checkbox-custom.tsx | SIM |
| Switch (Base UI) | switch.tsx | SIM |
| Switch Custom | switch-custom.tsx | SIM |
| Card | card.tsx | SIM |
| Badge | badge.tsx | SIM |
| Modal | modal.tsx | SIM |
| Dialog (Base UI) | dialog.tsx | SIM |
| Alert (Base UI) | alert.tsx | SIM |
| Alert Custom | alert-custom.tsx | SIM |
| Avatar (Base UI) | avatar.tsx | SIM |
| Avatar Custom | avatar-custom.tsx | SIM |
| Tabs (Base UI) | tabs.tsx | SIM |
| Tabs Custom | tabs-custom.tsx | SIM |
| Skeleton (Base UI) | skeleton.tsx | NAO |
| Skeleton Custom | skeleton-custom.tsx | SIM |
| Tooltip Custom | tooltip-custom.tsx | SIM |
| Toast (Base UI) | toast.tsx | SIM |
| Sonner | sonner.tsx | SIM |
| Table | table.tsx | SIM |
| Dropdown | dropdown-menu.tsx | SIM |
| Surface | surface.tsx | SIM |
| Container | container.tsx | SIM |
| Divider | divider.tsx | SIM |
| Typography | typography.tsx | SIM |
| IconBox | icon-box.tsx | SIM |
| StatCard | stat-card.tsx | SIM |
| PageHeader | page-header.tsx | SIM |
| EmptyState | empty-state.tsx | SIM |
| FormField | form-field.tsx | SIM |
| Section | section.tsx | SIM |
| ListItem | list-item.tsx | SIM |
| DataRow | data-row.tsx | SIM |
| Nocturne (GlowOrb, Logo, etc.) | nocturne.tsx | SIM |

### Componentes Faltantes

| Componente | Prioridade | Motivo |
|------------|------------|--------|
| Drawer | MEDIA | Necessário para mobile e menus laterais |
| Pagination | MEDIA | Necessário para listagens |
| Progress | BAIXA | Útil para uploads e loading |
| Breadcrumb | BAIXA | Útil para navegação |
| Slider | BAIXA | Raramente usado |

---

## 3. PARES DUPLICADOS — MAPA DE USO

### Checkbox: `checkbox.tsx` vs `checkbox-custom.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| register/page.tsx | checkbox.tsx (Base UI) | 1 |
| design-system/page.tsx | checkbox-custom.tsx | 2 |

**Recomendação:** Unificar em `checkbox-custom.tsx` (mais completo, tem Radio também)

### Switch: `switch.tsx` vs `switch-custom.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| settings/page.tsx | switch.tsx (Base UI) | 5 |
| design-system/page.tsx | switch-custom.tsx | 2 |

**Recomendação:** Unificar em `switch-custom.tsx` (estilos consistentes)

### Select: `select.tsx` vs `select-native.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| register/page.tsx | select.tsx (Base UI) | 1 |
| design-system/page.tsx | select-native.tsx | 1 |

**Recomendação:** Manter ambos. `select.tsx` para casos avançados, `select-native.tsx` para mobile.

### Modal: `modal.tsx` vs `dialog.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| design-system/page.tsx | modal.tsx | 1 |
| (nenhum) | dialog.tsx | 0 |

**Recomendação:** Remover `dialog.tsx` e usar apenas `modal.tsx`

### Toast: `toast.tsx` vs `sonner.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| layout.tsx | sonner.tsx | 1 (Toaster) |
| (nenhum) | toast.tsx | 0 |

**Recomendação:** Remover `toast.tsx` e usar apenas `sonner.tsx` (Sonner já é padrão)

### Avatar: `avatar.tsx` vs `avatar-custom.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| header.tsx (layout) | avatar.tsx | 1 |
| design-system/page.tsx | avatar-custom.tsx | 3 |

**Recomendação:** Unificar em `avatar-custom.tsx` (tem AvatarGroup)

### Tabs: `tabs.tsx` vs `tabs-custom.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| (nenhum) | tabs.tsx | 0 |
| design-system/page.tsx | tabs-custom.tsx | 1 |

**Recomendação:** Remover `tabs.tsx` e usar apenas `tabs-custom.tsx`

### Skeleton: `skeleton.tsx` vs `skeleton-custom.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| balance-card.tsx | skeleton.tsx | 1 |
| recent-transactions.tsx | skeleton.tsx | 1 |
| design-system/page.tsx | skeleton-custom.tsx | 3 |

**Recomendação:** Unificar em `skeleton-custom.tsx` (mais variantes)

### Alert: `alert.tsx` vs `alert-custom.tsx`

| Arquivo | Versão Usada | Ocorrências |
|---------|--------------|-------------|
| (nenhum) | alert.tsx | 0 |
| design-system/page.tsx | alert-custom.tsx | 4 |

**Recomendação:** Remover `alert.tsx` e usar apenas `alert-custom.tsx`

---

## 4. AUDITORIA DE USO NAS PÁGINAS

### Tabela de Componentes por Página

| Página/Rota | Componentes UI Usados | Estilização Manual |
|-------------|----------------------|-------------------|
| **(auth)/login** | Button, Input, GlowOrb, Logo | MUITO - divs com classes inline |
| **(auth)/register** | Button, Input, Checkbox (Base UI), Select (Base UI), GlowOrb | MUITO |
| **(auth)/forgot-password** | Button, Input, GlowOrb | MUITO |
| **(auth)/verify-email** | Button, GlowOrb | MUITO |
| **(main)/layout** | Button, GlowOrb, Logo | MODERADO |
| **(main)/dashboard** | Button, Card, Badge, TransactionIcon, Sparkline, Logo | MODERADO |
| **(main)/history** | Button | MUITO - StatusBadge manual |
| **(main)/settings** | Button, Input, Switch (Base UI) | MODERADO |
| **(main)/pix-keys** | Button | MUITO |
| **(main)/payment-links** | Button | MUITO |
| **(main)/subaccounts** | Button | MUITO |
| **(main)/developers** | Button | MUITO |
| **(main)/receive** | Button, Input, Card, Logo | MODERADO |
| **(main)/send** | Button, Input, Logo | MODERADO |
| **design-system** | TODOS os componentes | POUCO (showcase) |

### Legenda de Estilização Manual
- **POUCO**: Usa componentes da biblioteca, poucos estilos inline
- **MODERADO**: Mistura componentes com divs estilizados manualmente
- **MUITO**: Maioria das UI criada com divs + classes Tailwind inline

---

## 5. VALORES VISUAIS HARDCODED

### Border-radius Hardcoded (rounded-[Npx])

| Arquivo | Linha | Valor | Deveria Ser |
|---------|-------|-------|-------------|
| login/page.tsx | 123 | `rounded-[14px]` | `rounded-[--radius-lg]` |
| register/page.tsx | 145 | `rounded-[14px]` | `rounded-[--radius-lg]` |
| forgot-password/page.tsx | 139 | `rounded-[14px]` | `rounded-[--radius-lg]` |
| dashboard/page.tsx | 222 | `rounded-[10px]` | `rounded-[--radius-md]` |
| dashboard/page.tsx | 273 | `rounded-[10px]` | `rounded-[--radius-md]` |
| receive/page.tsx | 194 | `rounded-[14px]` | `rounded-[--radius-lg]` |
| receive/page.tsx | 251,360,377,395,420,461 | `rounded-[10px]`, `rounded-[9px]`, `rounded-[11px]` | `rounded-[--radius-md]` |
| send/page.tsx | 172 | `rounded-[14px]` | `rounded-[--radius-lg]` |
| send/page.tsx | 221,315,335,356,381,410 | `rounded-[10px]`, `rounded-[9px]`, `rounded-[11px]` | `rounded-[--radius-md]` |

**Total:** ~25 ocorrências

### Spacing Hardcoded (gap-[Npx], p-[Npx])

| Arquivo | Valores Encontrados |
|---------|---------------------|
| login/page.tsx | `gap-[14px]`, `gap-[6px]`, `gap-[2px]`, `p-[13px_16px]` |
| register/page.tsx | `gap-[14px]`, `gap-[6px]` |
| forgot-password/page.tsx | `gap-[14px]`, `gap-[6px]` |
| verify-email/page.tsx | `gap-[6px]` |
| layout.tsx (main) | `top-[-180px]`, `right-[-60px]` |

**Total:** ~20 ocorrências

### Cores Hardcoded (bg-[#], text-[#])

**Nenhuma encontrada** - Todas as páginas usam cores semânticas (`text-neutral-*`, `bg-accent-*`, etc.)

---

## 6. TOP 10 PÁGINAS MAIS INCONSISTENTES

Ordenado por número de violações (hardcodes + estilização manual):

| # | Página | Violações | Tipo |
|---|--------|-----------|------|
| 1 | **(main)/receive/page.tsx** | 12+ | radius hardcoded, divs manuais |
| 2 | **(main)/send/page.tsx** | 12+ | radius hardcoded, divs manuais |
| 3 | **(auth)/login/page.tsx** | 10+ | radius, spacing, divs manuais |
| 4 | **(main)/history/page.tsx** | 8+ | StatusBadge manual, tabela manual |
| 5 | **(auth)/register/page.tsx** | 6+ | radius, spacing hardcoded |
| 6 | **(main)/dashboard/page.tsx** | 6+ | radius hardcoded, cards manuais |
| 7 | **(auth)/forgot-password/page.tsx** | 5+ | radius, spacing hardcoded |
| 8 | **(main)/pix-keys/page.tsx** | 5+ | cards manuais |
| 9 | **(main)/payment-links/page.tsx** | 5+ | cards manuais |
| 10 | **(main)/subaccounts/page.tsx** | 5+ | cards manuais |

---

## 7. PROBLEMAS CRÍTICOS

1. **Componentes duplicados**: 9 pares de componentes fazem a mesma coisa (checkbox, switch, select, modal, toast, avatar, tabs, skeleton, alert)

2. **Spacing inconsistente**: Tokens `--space-*` definidos mas não usados - páginas usam valores arbitrários (`gap-[14px]`, `gap-[6px]`)

3. **Estilização manual excessiva**: A maioria das páginas cria UI com divs + Tailwind em vez de usar componentes

4. **Radius hardcoded**: ~25 ocorrências de `rounded-[10px]`, `rounded-[14px]` em vez de `rounded-[--radius-*]`

5. **Componentes de features usando Base UI direto**: `balance-card.tsx` e `recent-transactions.tsx` importam `skeleton.tsx` (Base UI) em vez de `skeleton-custom.tsx`

---

## 8. O QUE FOI FEITO CORRETAMENTE

1. Tokens de cores bem definidos e consistentes
2. Sistema de radius com variáveis CSS
3. Componentes base criados com variantes
4. Página `/design-system` como showcase
5. `index.ts` centralizando exportações
6. Nomenclatura consistente (`*-custom.tsx` para versões estilizadas)

---

## 9. PRÓXIMOS PASSOS (Sugestão de Prioridade)

### Fase 1: Unificar Duplicados
1. Decidir qual versão sobrevive para cada par
2. Migrar imports nas páginas
3. Remover arquivos obsoletos

### Fase 2: Migrar Páginas (ordem de prioridade do Top 10)
1. receive/page.tsx
2. send/page.tsx
3. login/page.tsx
4. history/page.tsx
5. register/page.tsx
6. dashboard/page.tsx
7. forgot-password/page.tsx
8. pix-keys/page.tsx
9. payment-links/page.tsx
10. subaccounts/page.tsx

### Fase 3: Padronizar Spacing
1. Definir escala de spacing (4, 8, 12, 16, 24, 32)
2. Atualizar globals.css
3. Substituir valores hardcoded

### Fase 4: Documentação
1. Documentar quando usar cada componente
2. Criar guia de estilos
3. Documentar padrão de ícones

---

## 10. ACHADOS VISUAIS NO SHOWCASE (/design-system)

Observações de inspeção visual realizada em 2026-08-05:

### 10.1 Input com fundo branco no tema escuro

O componente `Input` renderiza com fundo **BRANCO** no tema escuro (campos Email e Senha do showcase), enquanto `Textarea` e `Select` renderizam corretamente com fundo escuro.

**Investigar na fase de correção:**
- (a) Se o Input não está consumindo os tokens de background/border do tema (`bg-surface`, `border-divider`)
- (b) Se é o estilo de autofill do Chrome (`-webkit-autofill`) sobrescrevendo o visual — nesse caso será necessário fix de CSS específico para autofill

### 10.2 Checkbox e Radio com contraste muito baixo

Checkbox e Radio no estado **desmarcado** têm contraste muito baixo — quase invisíveis contra o fundo escuro.

**Investigar:** Tokens de borda e estado unchecked em `checkbox-custom.tsx`. Provavelmente precisa de `border-neutral-600` ou similar em vez de `border-neutral-800`.

### 10.3 Showcase mistura componentes base e -custom

O showcase atualmente exibe **ambas** as versões de componentes duplicados (ex: mostra tanto Switch Base UI quanto SwitchCustom), evidenciando a inconsistência.

**Ação futura:** Após a unificação dos pares duplicados, o showcase deve exibir **SOMENTE** os componentes oficiais sobreviventes.

### 10.4 Componentes sem arredondamento (aspecto quadrado)

Diversos componentes no showcase renderizam **sem arredondamento** (aspecto quadrado) apesar dos tokens `--radius-*` existirem no `globals.css`.

**Diagnóstico:** Confirma que parte dos componentes em `ui/` **não consome** os tokens de radius — usam valores Tailwind padrão (`rounded-lg`) ou nenhum arredondamento.

**Ação futura:** A regra de radius por tipo de componente será definida em `01-decisoes.md` e aplicada na fase de consolidação.

---

*Documento gerado automaticamente. Fonte de verdade para o retrofit visual do Nocturne Design System.*
