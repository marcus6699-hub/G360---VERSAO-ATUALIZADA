# MANIFESTO DE TRANSFERÊNCIA — G360 BUSINESS (AGENTE 4)
**Data de Emissão**: 28 de Outubro de 2026  
**Origem**: Google AI Studio (Agente 4 — Motor de IA, Branding, Pacote GBP e Conteúdos Comerciais)  
**Destinatário**: Codex (Integrador Técnico) / Usuário  
**Repositório Alvo**: `https://github.com/marcus6699-hub/Projeto-G360---3`  
**Nome do Pacote**: `G360-TRANSFER-AISTUDIO.zip`

---

## 1. INVENTÁRIO DOS ARQUIVOS E HASHES SHA-256

| Caminho no Repositório | Hash SHA-256 | Função / Responsabilidade |
| :--- | :--- | :--- |
| `src/lib/ai/promptHardening.ts` | `d7a518aa1ba946965dea5740a097f9730f68d15b3e0f7a9bf4cd67388cfbf29b` | Módulo de sanitização, anti-alucinação, detecção de contradições e fallback neutro. |
| `src/lib/ai/promptHardening.test.ts` | `68e46377d282f5f3e4bccb8b6247971392b7691dac4d0dfec46c6025fe16df90` | Suíte de testes automatizados com 10 cenários de validação e resiliência. |
| `src/lib/ai/g360AiPipeline.ts` | `10b8df8b884ebe618b6b6370c742b0c80d49b78ffc4d8b1ccbfb62fedd2955c5` | Pipeline de inteligência artificial, branding (3 paletas) e Pacote GBP (descrição 750c, 20 termos, 6 produtos reais ou pendentes, 11 posts, 20 nomes de fotos SEO). |
| `src/components/g360/G360GbpPackagePanel.jsx` | `98eaadcf11676f41694d2ba7aaab972a3bee0f15cc6c406ee4b29b00b9afb3de` | Painel de visualização e aprovação granular do Pacote GBP com isolamento de empresas. |
| `src/lib/sitegen/projectFactory.js` | `afdb23cf63b9b300833d025bd7b27bde37d521fe4629eb48418ac1e0d50d320d` | Fábrica de dados do site com filtro estrito anti-placeholders `[PENDENTE]`. |
| `docs/AISTUDIO-G360-EXECUCAO-MESTRE.md` | `6a1c392680fa99d52b3f8d0e358452b60730e0cbebaa78c272276cecb7e2626e` | Documento persistente de acompanhamento das 36 fases e histórico de validações. |

---

## 2. PONTOS DE INTEGRAÇÃO COM OUTROS AGENTES

### A. Trecho Compartilhado em `src/components/g360/G360GbpPackagePanel.jsx` (com Antigravity / OpenCode):
**Objetivo**: Garantir que a troca de empresa ativa (`activeBusiness`) resete completamente o estado anterior, impedindo vazamento ou mistura de dados entre clientes.
**Linhas 83 a 88**:
```javascript
useEffect(() => {
  if (activeBusiness?.name) {
    setPkg(null);
    setUserPhotos([]);
    setCustomDifferential("");
    generatePackage(activeBusiness);
  }
}, [activeBusiness?.name, activeBusiness?.place_id]);
```

### B. Trecho Compartilhado em `src/lib/sitegen/projectFactory.js` (com OpenCode):
**Objetivo**: Impedir que itens marcados como `[PENDENTE]` no catálogo interno do Pacote GBP cheguem ao site público renderizado.
**Linhas 48 a 52**:
```javascript
const destaqueSlots = [slotDest1, slotDest2, slotDest3, slotAmb];
const rawItems = (Array.isArray(business?.items) ? business.items : []).filter(
  (it) => it && !it.isPending && !String(it.name || "").includes("[PENDENTE]") && !String(it.description || "").includes("[PENDENTE]")
);
const enrichedItems = rawItems.map((it, idx) => {
```

### C. Módulos 100% Isolados (Sem Risco de Conflito):
- Todo o diretório `src/lib/ai/` (`promptHardening.ts`, `promptHardening.test.ts`, `g360AiPipeline.ts`) pode ser copiado diretamente para a branch de integração do Codex sem qualquer risco de sobrescrever autenticação, banco de dados ou regras do Firestore.

---

## 3. INSTRUÇÕES DE INTEGRAÇÃO PARA O CODEX
1. Crie uma branch de feature: `git checkout -b feature/agente4-ai-pipeline`.
2. Extraia o conteúdo de `G360-TRANSFER-AISTUDIO.zip` mantendo a estrutura de diretórios original:
   - `src/lib/ai/`
   - `src/components/g360/G360GbpPackagePanel.jsx`
   - `src/lib/sitegen/projectFactory.js`
   - `docs/`
3. Execute a suíte de testes:
   ```bash
   npx tsx --test src/lib/ai/promptHardening.test.ts
   ```
4. Execute o build para validação:
   ```bash
   npm run build
   ```
5. Faça o commit e merge controlado na branch principal de desenvolvimento.
