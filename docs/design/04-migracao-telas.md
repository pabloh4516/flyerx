# Migracao de Telas — Nocturne Design System

**Data de inicio:** 2026-08-05
**Fonte de verdade:** 01-decisoes.md (tabelas 7.1/7.2, regras 8.*, tipografia D.3, buttons D.2, contraste secao 14)
**Regra:** Atualizar IMEDIATAMENTE apos cada pagina migrada

---

## Grupo A — Receive + Send

### receive/page.tsx

#### Inventario de violacoes (ANTES)

**Sintaxe invalida `[--`:**
| Linha | Classe | Conversao |
|-------|--------|-----------|
| 203 | `rounded-[--radius-md]` | `rounded-md` |
| 206 | `rounded-[--radius-md]` | `rounded-md` |
| 263 | `rounded-[--radius-md]` | `rounded-md` |
| 273 | `rounded-[--radius-md]` | `rounded-md` |
| 331 | `rounded-[--radius-md]` | `rounded-md` |
| 394 | `rounded-[--radius-md]` | `rounded-md` |
| 431 | `rounded-[--radius-lg]` | `rounded-lg` |
| 443 | `rounded-[--radius-md]` | `rounded-md` |
| 447 | `rounded-[--radius-md]` | `rounded-md` |
| 451 | `rounded-[--radius-md]` | `rounded-md` |
| 472 | `rounded-[--radius-md]` | `rounded-md` |

**Valores arbitrarios de radius:**
| Linha | Valor | Conversao | Justificativa |
|-------|-------|-----------|---------------|
| 194 | `rounded-[14px]` | `rounded-lg` | Icon box = superficie |
| 251 | `rounded-[10px]` | `rounded-md` | Elemento compacto |
| 360 | `rounded-[10px]` | `rounded-md` | Elemento compacto |
| 377 | `rounded-[9px]` | `rounded-md` | Step number, arredonda para 8px |
| 395 | `rounded-[11px]` | `rounded-lg` | Status badge, arredonda para 14px |
| 420 | `rounded-[10px]` | `rounded-md` | Icon box compacto |
| 461 | `rounded-[10px]` | `rounded-md` | Icon box compacto |

**Valores arbitrarios de tamanho:**
| Linha | Valor | Conversao | Nota |
|-------|-------|-----------|------|
| 194 | `w-[46px] h-[46px]` | `size-12` (48px) | Arredonda para token mais proximo |
| 251 | `w-[38px] h-[38px]` | `size-10` (40px) | |
| 360 | `w-[38px] h-[38px]` | `size-10` | |
| 377 | `w-[30px] h-[30px]` | `size-8` (32px) | |
| 395 | `w-10 h-10` | OK | Ja e token |
| 420 | `w-[38px] h-[38px]` | `size-10` | |
| 433 | `w-[210px] h-[210px]` | MANTER | QR code, tamanho especifico |
| 461 | `w-[38px] h-[38px]` | `size-10` | |

**Tipografia fora da hierarquia:**
| Linha | Valor | Conversao (D.3) |
|-------|-------|-----------------|
| 198 | `text-[21px]` | `text-xl` (20px) — titulo de pagina secundario |
| 199 | `text-[12.5px]` | `text-xs` (12px) — descricao |
| 255 | `text-[14.5px]` | `text-sm` (14px) — titulo de card |
| 256 | `text-[11.5px]` | `text-xs` | |
| 265 | `text-[12px]` | `text-xs` | |
| 274 | `text-[10.5px]` | `text-[10px]` — kicker (excecao: 10px padrao) |
| 278 | `text-[15px]` | `text-sm` | |
| 284 | `text-[34px]` | `text-3xl` (30px) — valor monetario destaque |
| 289 | `text-[12px]` | `text-xs` | |
| 301 | `text-[12px]` | `text-xs` | |
| 312 | `text-[10.5px]` | `text-[10px]` — kicker |
| 321 | `text-[11px]` | `text-xs` | |
| 326 | `text-[12px]` | `text-xs` | |
| 332 | `text-[10.5px]` | `text-[10px]` — kicker |
| 336 | `text-[28px]` | `text-2xl` (24px) ou `text-3xl` (30px) — valor monetario |
| 339 | `text-[11.5px]` | `text-xs` | |
| Outros | `text-[Npx]` | Mapear para escala |

**Elementos manuais -> componentes:**
- L194-196: Header icon box → use `IconBox` com variant
- L213-244: Steps indicator → manter manual (componente especifico de fluxo)
- L263-270: Security notice → use `Alert` variant="warning"
- L273-291: Amount input card → `Card` ou `Surface`
- L376-385: How it works items → manter manual (lista numerada especifica)
- L443-455: Amount breakdown → manter manual (layout especifico)

**Conversoes aplicadas:**
| De | Para | Contexto |
|----|------|----------|
| `w-[46px] h-[46px]` | `size-12` | Header icon box |
| `rounded-[14px]` | `rounded-lg` | Header icon box |
| `text-[21px]` | `text-xl` | Titulo pagina |
| `text-[12.5px]` | `text-xs` | Descricao |
| `rounded-[--radius-md]` | `rounded-md` | Botoes auxiliares |
| `w-[38px] h-[38px] rounded-[10px]` | `size-10 rounded-md` | Icon boxes compactos |
| `text-[14.5px]` | `text-sm` | Titulos de card |
| `text-[11.5px]` | `text-xs` | Descricoes secundarias |
| `rounded-[--radius-md]` | `rounded-lg` | Cards e surfaces |
| `text-[10.5px]` | `text-[10px]` | Kickers (uppercase) |
| `text-[15px]` | `text-base` | Prefixo R$ |
| `text-[34px]` | `text-3xl` | Input valor grande |
| `text-[12px]` | `text-xs` | Mensagens erro |
| `text-[28px]` | `text-2xl` | Valor net amount |
| `text-[11px]` | `text-xs` | Hint text |
| `variant="primary"` (CTA) | `variant="solid"` | Botao principal da pagina (D.2) |
| `w-[30px] h-[30px] rounded-[9px]` | `size-8 rounded-md` | Step numbers |
| `text-[13.5px]` | `text-sm` | Titulos lista |
| `rounded-[11px]` | `rounded-lg` | Status badge |
| `rounded-[--radius-lg]` | `rounded-lg` | QR code container |
| `text-[9.5px]` | `text-[10px]` | Kickers breakdown |
| `text-[14px]` | `text-sm` | Valores breakdown |
| `text-[19px]` | `text-xl` | Titulo confirmacao |
| `text-[36px]` | `text-4xl` | Valor final |
| `w-16 h-16` | `size-16` | Check icon circle |
| `text-[11px]` (footer) | `text-xs` | Footer links |

**Excecoes mantidas:**
| Valor | Motivo |
|-------|--------|
| `w-[210px] h-[210px]` | QR code, dimensao especifica funcional |
| `grid-cols-[1fr_0.85fr]` | Grid proporcional, excecao valida |
| `shadow-[0_0_40px...]` | Efeito glow decorativo |
| `bg-[color-mix(...)]` | Color-mix para transparencia, sem equivalente token |
| `bg-[linear-gradient(...)]` | Gradiente complexo para borda, sem equivalente |

**TODO.md (achados):**
Nenhum achado funcional.

**Status:** MIGRADO em 2026-08-05. Build: PASSOU.

---

### send/page.tsx

#### Inventario de violacoes (ANTES)

**Sintaxe invalida `[--`:**
| Linha | Classe | Conversao |
|-------|--------|-----------|
| 244 | `rounded-[--radius-md]` | `rounded-md` |
| 283 | `rounded-[--radius-md]` | `rounded-md` |
| 333 | `rounded-[--radius-md]` | `rounded-md` |
| 355 | `rounded-[--radius-md]` | `rounded-md` |
| 392 | `rounded-[--radius-lg]` | `rounded-lg` |
| 399 | `rounded-[--radius-md]` | `rounded-md` |
| 421 | `rounded-[--radius-md]` | `rounded-md` |

**Valores arbitrarios de radius:**
| Linha | Valor | Conversao | Justificativa |
|-------|-------|-----------|---------------|
| 172 | `rounded-[14px]` | `rounded-lg` | Icon box |
| 221 | `rounded-[10px]` | `rounded-md` | Elemento compacto |
| 315 | `rounded-[10px]` | `rounded-md` | Icon box compacto |
| 335 | `rounded-[9px]` | `rounded-md` | Step badge |
| 356 | `rounded-[11px]` | `rounded-lg` | Status badge |
| 381 | `rounded-[10px]` | `rounded-md` | |
| 410 | `rounded-[10px]` | `rounded-md` | |

**Valores arbitrarios de tamanho:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 172 | `w-[46px] h-[46px]` | `size-12` |
| 221 | `w-[38px] h-[38px]` | `size-10` |
| 315 | `w-[38px] h-[38px]` | `size-10` |
| 335 | `w-8 h-8` | OK |
| 381 | `w-[38px] h-[38px]` | `size-10` |
| 393 | `w-[210px] h-[210px]` | MANTER — QR placeholder |
| 410 | `w-[38px] h-[38px]` | `size-10` |

**Tipografia fora da hierarquia:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 176 | `text-[21px]` | `text-xl` |
| 177 | `text-[12.5px]` | `text-xs` |
| 189 | `text-[12.5px]` | `text-xs` |
| 225 | `text-[14.5px]` | `text-sm` |
| 226 | `text-[11.5px]` | `text-xs` |
| 234 | `text-[10.5px]` | `text-[10px]` |
| 251 | `text-[11.5px]` | `text-xs` |
| 259 | `text-[10.5px]` | `text-[10px]` |
| 274 | `text-[12px]` | `text-xs` |
| 280 | `text-[10.5px]` | `text-[10px]` |
| 284 | `text-[14px]` | `text-sm` |
| 290 | `text-[26px]` | `text-2xl` |
| 295 | `text-[12px]` | `text-xs` |
| Outros | Mapear |

**Elementos manuais -> componentes:**
- L172-174: Header icon box → `IconBox`
- L244-253: PIX key type selector → manter manual (radio-like)
- L331-346: How it works cards → `Card` ou `Surface`

**Conversoes aplicadas:**
| De | Para | Contexto |
|----|------|----------|
| `w-[46px] h-[46px]` | `size-12` | Header icon box |
| `rounded-[14px]` | `rounded-lg` | Header icon box |
| `text-[21px]` | `text-xl` | Titulo pagina |
| `text-[12.5px]` | `text-xs` | Descricao/steps |
| `w-[38px] h-[38px] rounded-[10px]` | `size-10 rounded-md` | Icon boxes |
| `text-[14.5px]` | `text-sm` | Titulos card |
| `text-[11.5px]` | `text-xs` | Descricoes |
| `text-[10.5px]` | `text-[10px]` | Kickers |
| `rounded-[--radius-md]` | `rounded-md` | PIX key type buttons |
| `text-[12px]` | `text-xs` | Erros |
| `rounded-[--radius-md]` (card) | `rounded-lg` | Amount card |
| `text-[14px]` | `text-sm` | Prefixo R$ |
| `text-[26px]` | `text-2xl` | Valor input |
| `variant="primary"` (CTA) | `variant="solid"` | Botao principal (D.2) |
| `w-8 h-8 rounded-[9px]` | `size-8 rounded-md` | Step icons |
| `text-[13px]` | `text-sm` | Titulo step |
| `rounded-[--radius-md]` (how it works) | `rounded-lg` | Cards info |
| `w-10 h-10 rounded-[11px]` | `size-10 rounded-lg` | Status badge |
| `text-[14px]` (status) | `text-sm` | Status title |
| `rounded-[--radius-lg]` | `rounded-lg` | QR container |
| `text-[9.5px]` | `text-[10px]` | Kicker amount |
| `text-[20px]` | `text-xl` | Valor amount |
| `rounded-[--radius-md]` (address) | `rounded-lg` | Address card |
| `text-[11px]` | `text-xs` | Address text |
| `w-16 h-16` | `size-16` | Success icon |
| `text-[19px]` | `text-xl` | Success title |
| `text-[36px]` | `text-4xl` | Final value |
| `text-[11px]` (footer) | `text-xs` | Footer |

**Excecoes mantidas:**
| Valor | Motivo |
|-------|--------|
| `w-[210px] h-[210px]` | QR placeholder, dimensao funcional |
| `grid-cols-[1fr_0.85fr]` | Grid proporcional |
| `shadow-[0_0_40px...]` | Efeito glow decorativo |
| `bg-[color-mix(...)]` | Color-mix para transparencia |

**TODO.md (achados):**
Nenhum achado funcional.

**Status:** MIGRADO em 2026-08-05. Build: PASSOU.

---

## Grupo B — Fluxo de Autenticacao

### login/page.tsx

#### Inventario de violacoes (ANTES)

**Sintaxe invalida `[--`:**
| Linha | Classe | Conversao |
|-------|--------|-----------|
| 145 | `rounded-[--radius-md]` em estilo inline complexo | Reescrever com `Card` ou `Surface` |
| 188 | `rounded-[--radius-md]` | `rounded-md` |
| 199 | `rounded-[--radius-md]` | `rounded-lg` (input area) |

**Valores arbitrarios de radius:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 123 | `rounded-[14px]` | `rounded-lg` |

**Valores arbitrarios de tamanho:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 120 | `max-w-[400px]` | `max-w-sm` (384px) ou manter |
| 123 | `w-[52px] h-[52px]` | `size-14` (56px) |
| 319 | `size-[11px]` | `size-3` (12px) |

**Valores arbitrarios de spacing:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 122 | `gap-[14px]` | `gap-3.5` |
| 128 | `gap-[6px]` | `gap-1.5` |
| 141 | `gap-[14px]` | `gap-3.5` |
| 145 | `p-[13px_16px]` | `py-3 px-4` |
| 145 | `gap-[2px]` | `gap-0.5` |
| 196 | `gap-[14px]` | `gap-3.5` |
| 199 | `p-[13px_16px]` | `py-3 px-4` |
| 270 | `gap-[14px]` | `gap-3.5` |
| 318 | `gap-[6px]` | `gap-1.5` |

**Tipografia fora da hierarquia:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 129 | `text-[28px]` | `text-2xl` ou `text-3xl` |
| 134 | `text-[13.5px]` | `text-sm` |
| 146 | `text-[10.5px]` | `text-[10px]` |
| 154 | `text-[14.5px]` | `text-sm` |
| 164 | `text-[15px]` | `text-base` |
| 173 | `text-[14px]` | `text-sm` |
| 182 | `text-[11px]` | `text-xs` |
| 188 | `text-[14px]` | `text-sm` |
| 202 | `text-[10.5px]` | `text-[10px]` |
| 205 | `text-[14.5px]` | `text-sm` |
| 213 | `text-[12px]` | `text-xs` |
| 216 | `text-[12px]` | `text-xs` |
| 242 | `text-[12px]` | `text-xs` |
| 252 | `text-[15px]` | `text-base` |
| 272 | `text-[20px]` | `text-xl` |
| 273 | `text-[13px]` | `text-sm` |
| 286 | `text-[24px]` | `text-2xl` |
| 296 | `text-[15px]` | `text-base` |
| 318 | `text-[10.5px]` | `text-[10px]` |

**Elementos manuais -> componentes:**
- L123-126: Logo box → componente `Logo` ou manter manual (branding)
- L145-157: Email input glass → reescrever com `Input` padrao
- L199-206: Email readonly → `Surface` ou `Card` variant ghost

---

### register/page.tsx

#### Inventario de violacoes (ANTES)

**Sintaxe invalida `[--`:**
(Nenhuma ocorrencia `[--` encontrada)

**Valores arbitrarios de radius:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 145 | `rounded-[14px]` | `rounded-lg` |

**Valores arbitrarios de tamanho:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 145 | `w-[52px] h-[52px]` | `size-14` |
| 375 | `size-[11px]` | `size-3` |

**Valores arbitrarios de spacing:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 144 | `gap-[14px]` | `gap-3.5` |
| 150 | `gap-[6px]` | `gap-1.5` |
| 374 | `gap-[6px]` | `gap-1.5` |

**Tipografia fora da hierarquia:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 151 | `text-[28px]` | `text-2xl` |
| 154 | `text-[13.5px]` | `text-sm` |
| 172 | `text-[12px]` | `text-xs` |
| 180 | `text-[12px]` | `text-xs` |
| 186 | `text-[12px]` | `text-xs` |
| 194 | `text-[12px]` | `text-xs` |
| 201 | `text-[12px]` | `text-xs` |
| 223 | `text-[12px]` | `text-xs` |
| 236 | `text-[12px]` | `text-xs` |
| 241 | `text-[12px]` | `text-xs` |
| 250 | `text-[12px]` | `text-xs` |
| 260 | `text-[15px]` | `text-base` |
| 273 | `text-[13px]` | `text-sm` |
| 281 | `text-[12px]` | `text-xs` |
| 299 | `text-[12px]` | `text-xs` |
| 305 | `text-[12px]` | `text-xs` |
| 323 | `text-[12px]` | `text-xs` |
| 334 | `text-[12px]` | `text-xs` |
| 347 | `text-[12px]` | `text-xs` |
| 356 | `text-[15px]` | `text-base` |
| 365 | `text-[13px]` | `text-sm` |
| 374 | `text-[10.5px]` | `text-[10px]` |

---

### forgot-password/page.tsx

#### Inventario de violacoes (ANTES)

**Sintaxe invalida `[--`:**
| Linha | Classe | Conversao |
|-------|--------|-----------|
| 80 | `rounded-[--radius-xl]` | `rounded-xl` |
| 115 | `rounded-[--radius-xl]` | `rounded-xl` |

**Valores arbitrarios de radius:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 139 | `rounded-[14px]` | `rounded-lg` |

**Valores arbitrarios de tamanho:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 139 | `w-[52px] h-[52px]` | `size-14` |
| 199 | `size-[11px]` | `size-3` |

**Valores arbitrarios de spacing:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 138 | `gap-[14px]` | `gap-3.5` |
| 144 | `gap-[6px]` | `gap-1.5` |
| 198 | `gap-[6px]` | `gap-1.5` |

**Tipografia fora da hierarquia:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 69 | `text-[24px]` | `text-2xl` |
| 72 | `text-[13.5px]` | `text-sm` |
| 81 | `text-[13px]` | `text-sm` |
| 113 | `text-[10.5px]` | `text-[10px]` |
| 116 | `text-[13px]` | `text-sm` |
| 145 | `text-[28px]` | `text-2xl` |
| 148 | `text-[13.5px]` | `text-sm` |
| 158 | `text-[12px]` | `text-xs` |
| 166 | `text-[12px]` | `text-xs` |
| 176 | `text-[15px]` | `text-base` |
| 198 | `text-[10.5px]` | `text-[10px]` |

---

### verify-email/page.tsx

#### Inventario de violacoes (ANTES)

**Sintaxe invalida `[--`:**
| Linha | Classe | Conversao |
|-------|--------|-----------|
| 80 | `rounded-[--radius-xl]` | `rounded-xl` (se existir) |
| 115 | `rounded-[--radius-xl]` | `rounded-xl` |

**Valores arbitrarios de tamanho:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 137, 190 | `size-[11px]` | `size-3` |

**Valores arbitrarios de spacing:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 136, 189 | `gap-[6px]` | `gap-1.5` |

**Tipografia fora da hierarquia:**
| Linha | Valor | Conversao |
|-------|-------|-----------|
| 70 | `text-[24px]` | `text-2xl` |
| 73 | `text-[13.5px]` | `text-sm` |
| 105 | `text-[24px]` | `text-2xl` |
| 108 | `text-[13.5px]` | `text-sm` |
| 116 | `text-[13px]` | `text-sm` |
| 128 | `text-[15px]` | `text-base` |
| 136, 189 | `text-[10.5px]` | `text-[10px]` |
| 166 | `text-[24px]` | `text-2xl` |
| 169 | `text-[13.5px]` | `text-sm` |
| 182 | `text-[15px]` | `text-base` |

---

## Excecoes globais validas

1. **Posicionamento de glow orbs:** `top-[-180px]`, `right-[-60px]`, etc. — posicionamento absoluto de elementos decorativos e excecao valida conforme CLAUDE.md regra 7.
2. **max-w-[400px]**, **max-w-[420px]** — containers de formulario auth, valor especifico para UX. Avaliar conversao para `max-w-sm` (384px) ou `max-w-md` (448px).
3. **w-[210px] h-[210px]** — dimensoes de QR code, especifico da funcionalidade.
4. **text-[10px]** — kicker/eyebrow, valor padrao conforme D.3. Avaliar criar `text-2xs` no tema se muito frequente.

---

*Documento criado em 2026-08-05. Atualizar IMEDIATAMENTE apos cada pagina migrada.*
