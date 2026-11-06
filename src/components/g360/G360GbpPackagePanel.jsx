import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Tag,
  FileText,
  ShoppingBag,
  Calendar,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  Link2,
  Building2,
  Plus,
  Download,
  ExternalLink,
  ShieldCheck,
  PhoneCall,
  Trash2,
} from "lucide-react";
import { api, fmtErr } from "@/lib/api";
import {
  sanitizeAndDedupeBusinessPhotos,
  isOfficialGbpGalleryPhoto,
} from "@/lib/businessPhotoValidator";

export default function G360GbpPackagePanel({
  dark = false,
  activeBusiness,
  onOpenSiteExpressWithBriefing,
  onBack,
}) {
  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info"); // "info" | "services" | "products" | "posts" | "photos_site"
  const [copiedId, setCopiedId] = useState("");
  const [customDifferential, setCustomDifferential] = useState("");
  const [realNiche, setRealNiche] = useState(
    activeBusiness?.category || activeBusiness?.primary_type_display_name || activeBusiness?.type || ""
  );
  const [customSearchTermsText, setCustomSearchTermsText] = useState("");
  const [customProductNamesText, setCustomProductNamesText] = useState("");
  const [discoveringWeb, setDiscoveringWeb] = useState(false);
  const [modoIaCustomPrompt, setModoIaCustomPrompt] = useState("");
  const [selectedTone, setSelectedTone] = useState("comercial"); // "comercial" | "persuasivo" | "amigavel"
  const [hydratedBizKey, setHydratedBizKey] = useState("");

  // Add service modal/inline state
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [userPhotos, setUserPhotos] = useState([]);
  const [regeneratingKey, setRegeneratingKey] = useState("");
  const [regeneratingBatch, setRegeneratingBatch] = useState("");
  const [generatingAiPhoto, setGeneratingAiPhoto] = useState(false);
  const [fetchingRealPhotos, setFetchingRealPhotos] = useState(false);

  const getBizStorageKey = (biz) => {
    const raw = String(biz?.place_id || biz?.name || "default")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_");
    return `g360_gbp_pkg_v2_${raw}`;
  };

  const cleanLineItem = (line) =>
    String(line || "")
      .replace(/^[•\-\*\u2022\d]+[\.\)\-\s]*/, "")
      .trim();

  const persistDraftState = (biz, nextDraft) => {
    if (!biz?.name && !biz?.place_id) return;
    const storageKey = getBizStorageKey(biz);
    try {
      const existingRaw = localStorage.getItem(storageKey);
      const existing = existingRaw ? JSON.parse(existingRaw) : {};
      const merged = {
        ...existing,
        ...nextDraft,
        updatedAt: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch {
      // Ignore storage quota errors
    }
    api
      .post("/g360/gbp-package/save-draft", {
        businessName: biz?.name || nextDraft?.pkg?.businessName,
        placeId: biz?.place_id || "",
        ...nextDraft,
      })
      .catch(() => {});
  };

  const handleRegenerateBatch = async (batch_type) => {
    if (!pkg) return;
    setRegeneratingBatch(batch_type);
    try {
      const currentItems =
        batch_type === "services"
          ? pkg.services
          : batch_type === "products"
          ? pkg.products
          : batch_type === "posts"
          ? pkg.posts
          : [];
      const { data } = await api.post("/g360/gbp-package/regenerate-batch", {
        businessName: pkg.businessName || activeBusiness?.name || "Empresa Local",
        batch_type,
        customContext: customDifferential || pkg.customContext || "",
        currentItems,
        city: pkg.city || activeBusiness?.city || "Anápolis",
        uf: pkg.uf || activeBusiness?.uf || "GO",
        category: realNiche || pkg.primaryCategory || "Comércio Local",
      });
      if (data?.ok) {
        if (batch_type === "hero_copy") {
          setPkg((prev) => ({
            ...prev,
            siteBriefing: {
              ...(prev?.siteBriefing || {}),
              heroHeadline: data.heroHeadline || prev?.siteBriefing?.heroHeadline,
              heroSubheadline: data.heroSubheadline || prev?.siteBriefing?.heroSubheadline,
            },
          }));
          toast.success("Título Hero e Subtítulo recriados com IA!");
        } else if (batch_type === "services" && Array.isArray(data.items)) {
          setPkg((prev) => ({ ...prev, services: data.items }));
          toast.success("Todos os 20 serviços foram regenerados com descrições exclusivas via IA!");
        } else if (batch_type === "products" && Array.isArray(data.items)) {
          setPkg((prev) => ({ ...prev, products: data.items }));
          toast.success("Todas as 6 categorias de produtos foram regeneradas com IA!");
        } else if (batch_type === "posts" && Array.isArray(data.items)) {
          setPkg((prev) => ({ ...prev, posts: data.items, scheduledPosts: data.items }));
          toast.success("Todas as 11 publicações foram regeneradas com ângulos únicos via IA!");
        }
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao regenerar lote com IA"));
    } finally {
      setRegeneratingBatch("");
    }
  };

  const handleGenerateAiPhotoForPackage = async () => {
    if (!pkg) return;
    setGeneratingAiPhoto(true);
    try {
      const idx = userPhotos.length;
      const targetSeoName =
        pkg.photoSeoNames?.[idx % (pkg.photoSeoNames?.length || 1)] ||
        `${pkg.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-foto-${idx + 1}.jpg`;
      const svcFocus = pkg.services?.[idx % (pkg.services?.length || 1)]?.name || pkg.primaryCategory;
      const { data } = await api.post("/ai/image", {
        prompt: `Fotografia comercial realista de ${svcFocus} na empresa ${pkg.businessName} (${pkg.primaryCategory}) em ${pkg.city}`,
        businessName: pkg.businessName,
        city: pkg.city,
        category: pkg.primaryCategory,
        aspectRatio: "16:9",
      });
      if (data?.imageUrl) {
        setUserPhotos((prev) => [
          ...prev,
          { url: data.imageUrl, seoName: targetSeoName, label: svcFocus, selectedForSite: true },
        ]);
        toast.success(`Foto comercial gerada com IA e nomeada como ${targetSeoName}!`);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao gerar foto com IA"));
    } finally {
      setGeneratingAiPhoto(false);
    }
  };

  const cardClass = dark
    ? "bg-[#151126]/95 backdrop-blur-xl border border-white/10 text-[#F4F2FF] shadow-lg"
    : "bg-white/95 backdrop-blur-xl border border-purple-900/10 text-[#120E24] shadow-[0_6px_24px_-12px_rgba(88,28,135,0.12)]";
  const mutedText = dark ? "text-[#A39BBF]" : "text-[#5E5775]";
  const subtleBg = dark ? "bg-[#0B0914]" : "bg-[#FBF9FE]";
  const borderCol = dark ? "border-white/10" : "border-purple-900/10";

  const handleRegenerateItem = async (item_type, item_index, edited_title) => {
    const key = `${item_type}-${item_index}`;
    setRegeneratingKey(key);
    try {
      const { data } = await api.post("/g360/gbp-package/regenerate-item", {
        businessName: pkg?.businessName || activeBusiness?.name || "Empresa Local",
        item_type,
        item_index,
        edited_title: edited_title || "",
        customContext: customDifferential || pkg?.customContext || "",
        tone: selectedTone,
      });
      if (data?.description || data?.text) {
        setPkg((prev) => {
          if (!prev) return prev;
          const next = { ...prev };
          if (item_type === "service" && next.services?.[item_index]) {
            next.services = [...next.services];
            next.services[item_index] = {
              ...next.services[item_index],
              name: edited_title || next.services[item_index].name,
              description: data.description,
            };
          } else if (item_type === "product" && next.products?.[item_index]) {
            next.products = [...next.products];
            next.products[item_index] = {
              ...next.products[item_index],
              name: edited_title || next.products[item_index].name,
              description: data.description,
            };
          } else if (item_type === "post" && next.posts?.[item_index]) {
            next.posts = [...next.posts];
            next.posts[item_index] = {
              ...next.posts[item_index],
              title: edited_title || next.posts[item_index].title,
              text: data.text,
              charCount: data.charCount,
            };
          }
          return next;
        });
        toast.success(`Descrição gerada a partir do título "${edited_title}"!`);
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao regenerar item"));
    } finally {
      setRegeneratingKey("");
    }
  };

  const handleUpdateItem = (item_type, item_index, patch) => {
    setPkg((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (item_type === "service" && next.services?.[item_index]) {
        next.services = [...next.services];
        next.services[item_index] = { ...next.services[item_index], ...patch };
        if (patch.name && next.posts && next.posts[item_index]) {
          next.posts = [...next.posts];
          next.posts[item_index] = {
            ...next.posts[item_index],
            title: `${patch.name} em ${next.city || "sua cidade"}`,
          };
        }
      } else if (item_type === "product" && next.products?.[item_index]) {
        next.products = [...next.products];
        next.products[item_index] = { ...next.products[item_index], ...patch };
      } else if (item_type === "post" && next.posts?.[item_index]) {
        next.posts = [...next.posts];
        next.posts[item_index] = { ...next.posts[item_index], ...patch };
      }
      return next;
    });

    api
      .post("/g360/gbp-package/update-item", {
        businessName: pkg?.businessName || activeBusiness?.name,
        item_type,
        item_index,
        itemData: patch,
      })
      .then(({ data }) => {
        if (data?.pkg && item_type === "service" && patch.name) {
          setPkg(data.pkg);
        }
      })
      .catch(() => {});
  };

  const handleDeleteItem = (item_type, item_index) => {
    setPkg((prev) => {
      if (!prev) return prev;
      const next = { ...prev };
      if (item_type === "product" && Array.isArray(next.products)) {
        next.products = next.products.filter((_, i) => i !== item_index);
        const nextProdNames = next.products.map((p) => p.name).filter(Boolean);
        setCustomProductNamesText(nextProdNames.join("\n"));
        toast.success("Produto removido com sucesso!");
      } else if (item_type === "service" && Array.isArray(next.services)) {
        next.services = next.services.filter((_, i) => i !== item_index);
        const nextTerms = next.services.map((s) => s.name).filter(Boolean);
        setCustomSearchTermsText(nextTerms.join("\n"));
        toast.success("Serviço/Termo removido com sucesso!");
      }
      return next;
    });
  };

  const handleAddProduct = () => {
    setPkg((prev) => {
      if (!prev) return prev;
      const newProd = {
        name: `Novo Produto ${(prev.products?.length || 0) + 1}`,
        category: prev.primaryCategory || "Produtos",
        priceLabel: "Consulte pelo WhatsApp",
        selectedForSite: true,
        description: `Produto com alto padrão de qualidade e pronta entrega na ${prev.businessName || "nossa empresa"} em ${prev.city || "Anápolis"}. Solicite seu orçamento com nossa equipe pelo WhatsApp.`,
      };
      const nextProducts = [...(prev.products || []), newProd];
      setCustomProductNamesText(nextProducts.map((p) => p.name).filter(Boolean).join("\n"));
      toast.success("Novo produto adicionado!");
      return { ...prev, products: nextProducts };
    });
  };

  const generatePackage = async (bizOverride, opts = {}) => {
    setLoading(true);
    try {
      const target = bizOverride || activeBusiness || {
        name: "Empresa Local",
        category: "Comércio e Serviços Locais",
        city: "Anápolis",
        uf: "GO",
        phone: "(62) 99113-8004",
      };
      const toneToUse = opts.tone || selectedTone || "comercial";
      const contextToUse = opts.customContext !== undefined ? opts.customContext : customDifferential;
      const nicheToUse = opts.realNiche !== undefined ? opts.realNiche : realNiche;
      const parsedTerms = (
        opts.customSearchTerms !== undefined
          ? opts.customSearchTerms
          : customSearchTermsText.split(/\r?\n/)
      )
        .map(cleanLineItem)
        .filter(Boolean);
      const parsedProducts = (
        opts.customProductNames !== undefined
          ? opts.customProductNames
          : customProductNamesText.split(/\r?\n/)
      )
        .map(cleanLineItem)
        .filter(Boolean);

      const { data } = await api.post("/g360/gbp-package/generate", {
        business: target,
        realNiche: nicheToUse,
        customDifferential: contextToUse,
        customContext: contextToUse,
        customSearchTerms: parsedTerms,
        customProductNames: parsedProducts,
        tone: toneToUse,
        useAi: opts.useAi !== undefined ? Boolean(opts.useAi) : true,
      });
      if (data?.pkg) {
        setPkg(data.pkg);
        const nextTermsText =
          parsedTerms.length > 0
            ? parsedTerms.join("\n")
            : Array.isArray(data.pkg.services)
            ? data.pkg.services.map((s) => cleanLineItem(s.name)).join("\n")
            : customSearchTermsText;
        const nextProdsText =
          parsedProducts.length > 0
            ? parsedProducts.join("\n")
            : Array.isArray(data.pkg.products)
            ? data.pkg.products.map((p) => cleanLineItem(p.name)).join("\n")
            : customProductNamesText;

        if (!customSearchTermsText && nextTermsText) {
          setCustomSearchTermsText(nextTermsText);
        }
        if (!customProductNamesText && nextProdsText) {
          setCustomProductNamesText(nextProdsText);
        }

        persistDraftState(target, {
          realNiche: nicheToUse,
          customContext: contextToUse,
          customSearchTerms: nextTermsText.split(/\r?\n/).map(cleanLineItem).filter(Boolean),
          customProductNames: nextProdsText.split(/\r?\n/).map(cleanLineItem).filter(Boolean),
          tone: toneToUse,
          pkg: data.pkg,
        });

        if (opts.customContext || opts.customSearchTerms || opts.customProductNames) {
          toast.success(
            "Pacote atualizado em Categorias, Descrição 750c, 20 Serviços, 6 Produtos e 11 Publicações!"
          );
        }
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao gerar o pacote de otimização GBP"));
    } finally {
      setLoading(false);
    }
  };

  const handleDiscoverFromWeb = async (presetMode = "all") => {
    setDiscoveringWeb(true);
    try {
      const target = activeBusiness || {
        name: pkg?.businessName || "Empresa Local",
        category: realNiche || pkg?.primaryCategory || "Comércio Local",
        city: pkg?.city || "Anápolis",
        uf: pkg?.uf || "GO",
      };
      const { data } = await api.post("/g360/gbp-package/discover-web", {
        business: target,
        realNiche: realNiche || target.category || "",
        customPrompt: modoIaCustomPrompt || "",
      });
      if (data?.ok) {
        const payload = data.discovery || data;
        const discoveredNiche = payload.realNiche || realNiche || target.category || "";
        const discoveredBio = payload.commercialBio || customDifferential || "";
        const discoveredTerms = Array.isArray(payload.top20SearchTerms)
          ? payload.top20SearchTerms.map(cleanLineItem).filter(Boolean)
          : [];
        const discoveredProducts = Array.isArray(payload.top6Products)
          ? payload.top6Products.map(cleanLineItem).filter(Boolean)
          : [];

        const nextNiche = presetMode === "all" || !realNiche ? discoveredNiche : realNiche;
        const nextBio =
          presetMode === "all" || presetMode === "bio" ? discoveredBio : customDifferential;
        const nextTermsList =
          presetMode === "all" || presetMode === "terms"
            ? discoveredTerms
            : customSearchTermsText.split(/\r?\n/).map(cleanLineItem).filter(Boolean);
        const nextProdsList =
          presetMode === "all" || presetMode === "products"
            ? discoveredProducts
            : customProductNamesText.split(/\r?\n/).map(cleanLineItem).filter(Boolean);

        setRealNiche(nextNiche);
        if (presetMode === "all" || presetMode === "bio") {
          setCustomDifferential(nextBio);
        }
        if ((presetMode === "all" || presetMode === "terms") && nextTermsList.length > 0) {
          setCustomSearchTermsText(nextTermsList.join("\n"));
        }
        if ((presetMode === "all" || presetMode === "products") && nextProdsList.length > 0) {
          setCustomProductNamesText(nextProdsList.join("\n"));
        }

        toast.success(
          presetMode === "bio"
            ? `Bio Comercial Completa (${nextBio.length} caracteres sem emojis) gerada na Caixa 2!`
            : presetMode === "terms"
            ? "20 Termos Locais limpos (sem numeração) preenchidos na Caixa 3!"
            : presetMode === "products"
            ? "6 Categorias de Produtos (apenas nomes) preenchidas na Caixa 4!"
            : `Pesquisa Modo IA concluída: Bio (${nextBio.length}c) + 20 Termos + 6 Produtos preenchidos e salvos!`
        );

        await generatePackage(target, {
          realNiche: nextNiche,
          customContext: nextBio,
          customSearchTerms: nextTermsList,
          customProductNames: nextProdsList,
          tone: selectedTone,
          useAi: true,
        });
      }
    } catch (e) {
      toast.error(fmtErr(e, "Erro ao pesquisar dados da empresa no Google com IA"));
    } finally {
      setDiscoveringWeb(false);
    }
  };

  const fetchRealGooglePhotosForBusiness = async (bizObj, existingUrls = [], silent = false) => {
    if (!bizObj?.name || String(bizObj?.place_id || "").startsWith("demo-")) return;
    setFetchingRealPhotos(true);
    try {
      const { data } = await api.post("/places/real-photos", {
        placeId: bizObj.place_id || "",
        name: bizObj.name || "",
        city: bizObj.city || "",
        uf: bizObj.uf || "",
        address: bizObj.address || "",
        existingPhotos: existingUrls,
      });
      const cleanUrls = sanitizeAndDedupeBusinessPhotos(data?.photos || [], {
        dropStreetViewIfGalleryExists: true,
        maxPhotos: 10,
      });
      if (cleanUrls.length > 0) {
        setUserPhotos((prev) => {
          // Keep any manually uploaded data:image base64 photos
          const manualUploads = prev.filter((item) => String(item?.url || "").startsWith("data:image/"));
          const mappedOfficial = cleanUrls.map((url, idx) => ({
            url,
            seoName:
              pkg?.photoSeoNames?.[idx % (pkg?.photoSeoNames?.length || 1)] || `foto-oficial-${idx + 1}.jpg`,
            label: idx === 0 ? "Capa Principal (Hero)" : `Foto Oficial da Ficha #${idx + 1}`,
            selectedForSite: true,
          }));
          return [...mappedOfficial, ...manualUploads].slice(0, 12);
        });
        // Update cached activeBusiness in localStorage so reloads keep the real photos
        try {
          const savedBizRaw = localStorage.getItem("g360_active_business_v1");
          if (savedBizRaw) {
            const parsedBiz = JSON.parse(savedBizRaw);
            if (parsedBiz && parsedBiz.name === bizObj.name) {
              parsedBiz.photos = cleanUrls;
              parsedBiz.photo = cleanUrls[0] || parsedBiz.photo;
              localStorage.setItem("g360_active_business_v1", JSON.stringify(parsedBiz));
            }
          }
        } catch {}
        if (!silent) {
          toast.success(`${cleanUrls.length} foto(s) oficial(is) verificada(s) da ficha do Google!`);
        }
      } else if (!silent) {
        toast.info("Nenhuma foto adicional encontrada na ficha oficial desta empresa.");
      }
    } catch (e) {
      if (!silent) {
        toast.error(fmtErr(e, "Erro ao buscar fotos oficiais da ficha"));
      }
    } finally {
      setFetchingRealPhotos(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const rawPhotos = Array.isArray(activeBusiness?.photos) ? activeBusiness.photos : [];
    const cleanedInitialUrls = sanitizeAndDedupeBusinessPhotos(rawPhotos, {
      dropStreetViewIfGalleryExists: true,
      maxPhotos: 10,
    });
    const initialBizPhotos = cleanedInitialUrls.map((url, idx) => ({
      url,
      seoName: `foto-oficial-${idx + 1}.jpg`,
      label: idx === 0 ? "Capa Principal (Hero)" : `Foto Oficial da Ficha #${idx + 1}`,
      selectedForSite: true,
    }));
    setUserPhotos(initialBizPhotos);

    // Automatically pull official GBP gallery photos if we have fewer than 4 official GBP photos
    const officialGbpCount = cleanedInitialUrls.filter((u) => isOfficialGbpGalleryPhoto(u)).length;
    if (
      activeBusiness?.name &&
      !String(activeBusiness?.place_id || "").startsWith("demo-") &&
      officialGbpCount < 4
    ) {
      fetchRealGooglePhotosForBusiness(activeBusiness, cleanedInitialUrls, true);
    }

    const storageKey = getBizStorageKey(activeBusiness);
    const inferTrueBusinessCityUf = (bizObj) => {
      const combined = `${bizObj?.name || ""} ${bizObj?.address || ""} ${bizObj?.city || ""}`;
      const phoneDigits = String(bizObj?.phone || "").replace(/\D/g, "");
      if (
        /florian[oó]polis|\bfloripa\b|beira\s*mar\s*norte|jurer[eê]|trindade|campeche|ingleses/i.test(combined) ||
        phoneDigits.startsWith("5548") ||
        (phoneDigits.length >= 10 && phoneDigits.slice(0, 2) === "48")
      ) {
        return { city: "Florianópolis", uf: "SC" };
      }
      if (bizObj?.city && bizObj.city !== "Anápolis") {
        return { city: bizObj.city, uf: bizObj.uf || "BR" };
      }
      return null;
    };
    const expectedCityUf = inferTrueBusinessCityUf(activeBusiness);

    const hydrateOrGenerate = async () => {
      // 1. Check localStorage first for instant zero-loss reload (F5)
      try {
        const localRaw = localStorage.getItem(storageKey);
        if (localRaw) {
          const parsedLocal = JSON.parse(localRaw);
          const isStaleWrongCity =
            expectedCityUf &&
            parsedLocal?.pkg?.city === "Anápolis" &&
            expectedCityUf.city !== "Anápolis";
          if (isStaleWrongCity) {
            localStorage.removeItem(storageKey);
          } else if (parsedLocal?.pkg && parsedLocal.pkg.businessName) {
            if (cancelled) return;
            setPkg(parsedLocal.pkg);
            setRealNiche(
              parsedLocal.realNiche ||
                parsedLocal.pkg.realNiche ||
                activeBusiness?.category ||
                parsedLocal.pkg.primaryCategory ||
                ""
            );
            setCustomDifferential(
              parsedLocal.customContext !== undefined
                ? parsedLocal.customContext
                : parsedLocal.pkg.customContext || activeBusiness?.bio || ""
            );
            const savedTerms = Array.isArray(parsedLocal.customSearchTerms)
              ? parsedLocal.customSearchTerms
              : Array.isArray(parsedLocal.pkg.customSearchTerms)
              ? parsedLocal.pkg.customSearchTerms
              : (parsedLocal.pkg.services || []).map((s) => s.name);
            const savedProds = Array.isArray(parsedLocal.customProductNames)
              ? parsedLocal.customProductNames
              : Array.isArray(parsedLocal.pkg.customProductNames)
              ? parsedLocal.pkg.customProductNames
              : (parsedLocal.pkg.products || []).map((p) => p.name);
            setCustomSearchTermsText(savedTerms.map(cleanLineItem).filter(Boolean).join("\n"));
            setCustomProductNamesText(savedProds.map(cleanLineItem).filter(Boolean).join("\n"));
            setSelectedTone(parsedLocal.tone || parsedLocal.pkg.tone || "comercial");
            setHydratedBizKey(storageKey);
            return;
          }
        }
      } catch {
        // Fallback to server check
      }

      // 2. Check server persisted draft (/g360/gbp-package/saved)
      try {
        const { data } = await api.get("/g360/gbp-package/saved", {
          params: {
            businessName: activeBusiness?.name || "",
            placeId: activeBusiness?.place_id || "",
          },
        });
        const isStaleSrvCity =
          expectedCityUf &&
          data?.pkg?.city === "Anápolis" &&
          expectedCityUf.city !== "Anápolis";
        if (!cancelled && !isStaleSrvCity && data?.pkg && data.pkg.businessName) {
          const srvPkg = data.pkg;
          setPkg(srvPkg);
          const srvNiche =
            srvPkg.realNiche ||
            activeBusiness?.category ||
            srvPkg.primaryCategory ||
            "";
          const srvCtx =
            srvPkg.customContext !== undefined
              ? srvPkg.customContext
              : activeBusiness?.bio || activeBusiness?.description || "";
          const srvTerms = Array.isArray(srvPkg.customSearchTerms)
            ? srvPkg.customSearchTerms
            : (srvPkg.services || []).map((s) => s.name);
          const srvProds = Array.isArray(srvPkg.customProductNames)
            ? srvPkg.customProductNames
            : (srvPkg.products || []).map((p) => p.name);

          setRealNiche(srvNiche);
          setCustomDifferential(srvCtx);
          setCustomSearchTermsText(srvTerms.map(cleanLineItem).filter(Boolean).join("\n"));
          setCustomProductNamesText(srvProds.map(cleanLineItem).filter(Boolean).join("\n"));
          setSelectedTone(srvPkg.tone || "comercial");
          setHydratedBizKey(storageKey);
          return;
        }
      } catch {
        // Ignore and generate fresh
      }

      if (cancelled) return;
      // 3. Only generate default package if no saved state exists for this business
      setPkg(null);
      const initialNiche =
        activeBusiness?.category || activeBusiness?.primary_type_display_name || activeBusiness?.type || "";
      const initialBio = activeBusiness?.bio || activeBusiness?.description || "";
      setRealNiche(initialNiche);
      setCustomDifferential(initialBio);
      setCustomSearchTermsText("");
      setCustomProductNamesText("");
      setSelectedTone("comercial");
      await generatePackage(activeBusiness, {
        useAi: true,
        tone: "comercial",
        realNiche: initialNiche,
        customContext: initialBio,
      });
      if (!cancelled) {
        setHydratedBizKey(storageKey);
      }
    };

    hydrateOrGenerate();
    return () => {
      cancelled = true;
    };
  }, [activeBusiness?.name, activeBusiness?.place_id]);

  // Auto-save edits to Box 1, Box 2, Box 3, Box 4, and pkg so F5 reload never loses user input
  useEffect(() => {
    const currentKey = getBizStorageKey(activeBusiness);
    if (!pkg || hydratedBizKey !== currentKey) return;
    const timer = setTimeout(() => {
      persistDraftState(activeBusiness, {
        realNiche,
        customContext: customDifferential,
        customSearchTerms: customSearchTermsText.split(/\r?\n/).map(cleanLineItem).filter(Boolean),
        customProductNames: customProductNamesText.split(/\r?\n/).map(cleanLineItem).filter(Boolean),
        tone: selectedTone,
        pkg,
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [
    hydratedBizKey,
    realNiche,
    customDifferential,
    customSearchTermsText,
    customProductNamesText,
    selectedTone,
    pkg,
  ]);

  // Keep userPhotos synced and sanitized if activeBusiness.photos gets enriched with more photos
  useEffect(() => {
    const rawPhotos = Array.isArray(activeBusiness?.photos) ? activeBusiness.photos : [];
    const cleaned = sanitizeAndDedupeBusinessPhotos(rawPhotos, {
      dropStreetViewIfGalleryExists: true,
      maxPhotos: 10,
    });
    if (cleaned.length > userPhotos.length) {
      setUserPhotos(
        cleaned.map((url, idx) => ({
          url,
          seoName: pkg?.photoSeoNames?.[idx % (pkg?.photoSeoNames?.length || 1)] || `foto-oficial-${idx + 1}.jpg`,
          label: idx === 0 ? "Capa Principal (Hero)" : `Foto Oficial da Ficha #${idx + 1}`,
          selectedForSite: true,
        }))
      );
    }
  }, [activeBusiness?.photos?.length]);

  const handleSelectTone = (newTone) => {
    setSelectedTone(newTone);
    if (pkg?.textVariations?.[newTone]) {
      const nextDesc = pkg.textVariations[newTone];
      setPkg((prev) => ({
        ...prev,
        tone: newTone,
        description750: nextDesc,
        descriptionCharCount: nextDesc.length,
      }));
      toast.success(
        newTone === "persuasivo"
          ? "Variação 2 ativada: Tom Mais Persuasivo & Autoridade"
          : newTone === "amigavel"
          ? "Variação 3 ativada: Tom Mais Amigável & Acolhedor"
          : "Variação 1 ativada: Tom Mais Comercial & Vendas"
      );
    } else {
      generatePackage(activeBusiness, { tone: newTone, useAi: false });
    }
  };

  const copyText = (text, id, label = "Conteúdo copiado") => {
    navigator.clipboard.writeText(String(text || ""));
    setCopiedId(id);
    toast.success(label);
    setTimeout(() => setCopiedId(""), 1800);
  };

  const handleSyncToGoogle = (sectionName, textToCopy) => {
    if (textToCopy) {
      navigator.clipboard.writeText(String(textToCopy));
      toast.success(`${sectionName} copiado! Abrindo painel do Google Meu Negócio...`);
    } else {
      toast.info("Abrindo painel oficial do Google Meu Negócio...");
    }
    window.open("https://business.google.com/", "_blank", "noopener,noreferrer");
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceName.trim() || !pkg) return;
    const desc =
      newServiceDesc.trim() ||
      `${newServiceName.trim()} em ${pkg.city} com atendimento especializado, materiais selecionados e acabamento profissional pela equipe da ${pkg.businessName}. Solicite orçamento rápido.`;
    const updated = {
      ...pkg,
      services: [
        {
          name: newServiceName.trim(),
          category: pkg.primaryCategory,
          localTerm: `${newServiceName.trim().toLowerCase()} ${pkg.city.toLowerCase()}`,
          description: desc.slice(0, 300),
        },
        ...(pkg.services || []),
      ],
    };
    setPkg(updated);
    setNewServiceName("");
    setNewServiceDesc("");
    toast.success("Serviço SEO adicionado ao pacote");
  };

  const handleDownloadPackageMarkdown = () => {
    if (!pkg) return;
    const md = `# PACOTE DE OTIMIZACAO GBP & BRIEFING DE SITE — ${pkg.businessName.toUpperCase()}
Cidade: ${pkg.city} - ${pkg.uf}
Telefone: ${pkg.phone}
Link WhatsApp Oficial: ${pkg.whatsappUrl}
${pkg.websiteUrl ? `Website Oficial (Site Express): ${pkg.websiteUrl}\n` : ""}
## 1. CATEGORIAS DO PERFIL
- Categoria Principal: ${pkg.primaryCategory}
- Categorias Adicionais:
${(pkg.additionalCategories || []).map((c) => `  * ${c}`).join("\n")}

## 2. DESCRICAO COM SEO SEMANTICO (750 CARACTERES)
(${pkg.description750.length}/750 caracteres)
${pkg.description750}

## 3. SERVICOS OTIMIZADOS COM PALAVRAS-CHAVE LOCAIS (ATE 300 CARACTERES CADA)
${(pkg.services || [])
  .map(
    (s, i) =>
      `### ${i + 1}. ${s.name} (${s.category})\n- Termo local: ${s.localTerm}\n- Descricao (${s.description.length}/300c): ${s.description}`
  )
  .join("\n\n")}

## 4. CATALOGO DE PRODUTOS GBP
${(pkg.products || [])
  .map((p, i) => `### Produto ${i + 1}: ${p.name} [${p.category}]\n- Preco/CTA: ${p.priceLabel}\n- Descricao: ${p.description}`)
  .join("\n\n")}

## 5. CRONOGRAMA DE 10 PUBLICACOES AGENDADAS (ATE 1500 CARACTERES)
${(pkg.posts || [])
  .map(
    (pt) =>
      `### Post #${pt.number} — ${pt.title} (${pt.objective})\n- Data sugerida: ${pt.scheduledDate} as ${pt.scheduledTime}\n- Botao CTA: ${pt.ctaType} (${pt.ctaPhone})\n- Direcao de Foto: ${pt.imageDirection}\n- Texto (${pt.charCount}/1500c):\n${pt.text}`
  )
  .join("\n\n")}

## 6. NOMES SEO PARA ARQUIVOS DE FOTOGRAFIA
${(pkg.photoSeoNames || []).map((f) => `- ${f}`).join("\n")}
`;
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pacote-gbp-${pkg.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Documento completo do Pacote GBP baixado!");
  };

  if (!pkg) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-12 text-center">
        <RefreshCw size={24} className="animate-spin mx-auto text-[#7C3AED]" />
        <p className={`mt-3 text-[14px] ${mutedText}`}>Preparando pacote de otimização GBP...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-purple-300 bg-purple-50 hover:bg-purple-100 text-[#7C3AED] text-[13px] font-bold cursor-pointer transition-colors shadow-sm"
        >
          ← Voltar para Auditoria
        </button>
      )}
      {/* HEADER: Active Profile + Google Business Profile API Sync & Export */}
      <section className={`rounded-2xl p-5 sm:p-6 ${cardClass}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-inherit">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] text-white flex items-center justify-center shrink-0 shadow-md">
              <Building2 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[#7C3AED]">
                <span>Central de Otimizacao @pacote-gbp</span>
                <span>·</span>
                <span>Padrao Google Meu Negocio</span>
              </div>
              <h1 className="text-[22px] sm:text-[25px] font-extrabold tracking-tight mt-0.5">
                {pkg.businessName} — {pkg.city}/{pkg.uf}
              </h1>
              <p className={`text-[13px] mt-0.5 ${mutedText}`}>
                Gere, personalize com contexto real, escolha entre 3 tons comerciais e sincronize com o Site Express.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadPackageMarkdown}
              className={`px-4 py-2.5 rounded-xl border text-[13px] font-bold flex items-center gap-2 cursor-pointer ${borderCol} ${subtleBg} hover:border-[#7C3AED]`}
            >
              <Download size={15} className="text-[#7C3AED]" />
              <span>Baixar Pacote Completo (.MD)</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenSiteExpressWithBriefing &&
                onOpenSiteExpressWithBriefing(activeBusiness, {
                  ...pkg,
                  customPhotos: userPhotos.filter((p) => p.selectedForSite !== false).map((p) => p.url),
                })
              }
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-[13px] font-bold flex items-center gap-2 shadow-md cursor-pointer"
              data-testid="transfer-to-site-express-btn"
            >
              <Layers size={15} />
              <span>Abrir no Site Express com Briefing Pronto</span>
            </button>
          </div>
        </div>

        {/* NICHO REAL + PESQUISADOR MODO IA INTERNO + 4 CAIXAS ESTRUTURADAS E PERSISTENTES */}
        <div className={`mt-4 p-4 sm:p-5 rounded-xl border ${borderCol} ${subtleBg} space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[12px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
              <Sparkles size={14} />
              <span>Central Modo IA Integrada · Bio Completa + 20 Termos Locais + 6 Categorias de Produtos</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-bold">
                Salvamento Automático Ativo
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {pkg.websiteUrl && (
                <div className="flex items-center gap-2 text-[12px]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#16A34A]/15 text-[#16A34A] font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={13} />
                    Site Express: {pkg.websiteUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(window.location.origin + pkg.websiteUrl, "sync-site-url", "URL do site copiada!")}
                    className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-white font-bold cursor-pointer"
                  >
                    Copiar URL
                  </button>
                </div>
              )}
              <button
                type="button"
                disabled={discoveringWeb || loading}
                onClick={() => handleDiscoverFromWeb("all")}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[12.5px] font-extrabold flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                data-testid="gbp-discover-web-btn"
              >
                <Sparkles size={14} className={discoveringWeb ? "animate-spin" : ""} />
                <span>
                  {discoveringWeb
                    ? "Pesquisando Empresa no Modo IA..."
                    : "Descobrir Tudo no Google com IA (Bio + 20 Termos + 6 Produtos)"}
                </span>
              </button>
            </div>
          </div>

          {/* Barra Rápida Modo IA Interno (Sem precisar sair para outra aba) */}
          <div className={`p-3 rounded-xl border ${borderCol} flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 ${dark ? "bg-[#151126]/70" : "bg-white/90"}`}>
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={modoIaCustomPrompt}
                onChange={(e) => setModoIaCustomPrompt(e.target.value)}
                placeholder={`Instrução opcional para o Modo IA interno (ex: focar em câmaras frias, assistência técnica e peças em ${pkg.city})...`}
                className={`w-full px-3 py-1.5 rounded-lg border text-[12px] outline-none focus:border-[#7C3AED] ${
                  dark ? "bg-[#0B0914] border-white/15 text-white" : "bg-[#FBF9FE] border-purple-900/15 text-[#120E24]"
                }`}
                data-testid="gbp-modo-ia-prompt-input"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={discoveringWeb || loading}
                onClick={() => handleDiscoverFromWeb("bio")}
                className={`px-3 py-1.5 rounded-lg border text-[11.5px] font-bold cursor-pointer hover:border-[#7C3AED] disabled:opacity-50 ${borderCol}`}
                data-testid="gbp-modo-ia-bio-btn"
              >
                Gerar Só Bio Completa (~2.500c sem Emojis)
              </button>
              <button
                type="button"
                disabled={discoveringWeb || loading}
                onClick={() => handleDiscoverFromWeb("terms")}
                className={`px-3 py-1.5 rounded-lg border text-[11.5px] font-bold cursor-pointer hover:border-[#7C3AED] disabled:opacity-50 ${borderCol}`}
                data-testid="gbp-modo-ia-terms-btn"
              >
                Gerar Só 20 Termos (Sem Número)
              </button>
              <button
                type="button"
                disabled={discoveringWeb || loading}
                onClick={() => handleDiscoverFromWeb("products")}
                className={`px-3 py-1.5 rounded-lg border text-[11.5px] font-bold cursor-pointer hover:border-[#7C3AED] disabled:opacity-50 ${borderCol}`}
                data-testid="gbp-modo-ia-products-btn"
              >
                Gerar Só 6 Categorias de Produtos
              </button>
            </div>
          </div>

          {/* Row 1: Nicho / Especialidade Real + Bio Comercial (Multi-line Textarea Box) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED] block mb-1">
                  1. Nicho / Especialidade Real (Define Concorrentes e Termos)
                </label>
                <input
                  type="text"
                  value={realNiche}
                  onChange={(e) => setRealNiche(e.target.value)}
                  placeholder="Ex: Fornecedor de refrigeradores comerciais, Marcenaria Sob Medida..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-semibold outline-none focus:border-[#7C3AED] ${
                    dark ? "bg-[#151126] border-white/15 text-white" : "bg-white border-purple-900/15 text-[#120E24]"
                  }`}
                  data-testid="gbp-real-niche-input"
                />
              </div>
              <p className={`text-[11px] mt-1.5 ${mutedText}`}>
                Dica: Você pode ajustar o nicho principal acima para refinar os 20 serviços e 6 produtos.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                  2. Resumo Comercial / Diferenciais e História da Empresa (Sem Limite de Caracteres)
                </label>
                <span className={`text-[11px] font-mono font-bold ${mutedText}`}>
                  {(customDifferential || "").length} caracteres
                </span>
              </div>
              <textarea
                rows={5}
                value={customDifferential}
                onChange={(e) => setCustomDifferential(e.target.value)}
                placeholder="Descreva detalhadamente o que a empresa vende, marcas, tipos de equipamentos, história, diferenciais de atendimento, peças, serviços ou clique em 'Descobrir Tudo no Google com IA'..."
                className={`w-full p-3 rounded-xl border text-[13px] leading-relaxed outline-none focus:border-[#7C3AED] ${
                  dark ? "bg-[#151126] border-white/15 text-white" : "bg-white border-purple-900/15 text-[#120E24]"
                }`}
                data-testid="gbp-custom-context-input"
              />
            </div>
          </div>

          {/* Row 2: 20 Local Search Terms (feeds Aba 02 + Aba 04) & 6 Main Products (feeds Aba 03) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-7">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                  3. 20 Termos mais Buscados no Nicho (1 por linha → Gera Aba 02: 20 Serviços + Aba 04: Posts)
                </label>
                <span className={`text-[11px] font-mono ${mutedText}`}>
                  {customSearchTermsText.split(/\r?\n/).filter((x) => x.trim()).length} / 20 termos
                </span>
              </div>
              <textarea
                rows={4}
                value={customSearchTermsText}
                onChange={(e) => {
                  const cleaned = e.target.value
                    .split(/\r?\n/)
                    .map((line) => line.replace(/^[•\-\*\u2022\d]+[\.\)\-\s]+/, ""))
                    .join("\n");
                  setCustomSearchTermsText(cleaned);
                }}
                placeholder={`Digite ou cole 1 termo local por linha (sem numeração) para ${pkg.businessName} em ${pkg.city}...`}
                className={`w-full p-3 rounded-xl border text-[12.5px] leading-relaxed outline-none focus:border-[#7C3AED] ${
                  dark ? "bg-[#151126] border-white/15 text-white" : "bg-white border-purple-900/15 text-[#120E24]"
                }`}
                data-testid="gbp-20-terms-textarea"
              />
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between gap-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                    4. 6 Produtos / Especialidades Principais (1 por linha → Gera Aba 03)
                  </label>
                  <span className={`text-[11px] font-mono ${mutedText}`}>
                    {customProductNamesText.split(/\r?\n/).filter((x) => x.trim()).length} / 6 produtos
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={customProductNamesText}
                  onChange={(e) => {
                    const cleaned = e.target.value
                      .split(/\r?\n/)
                      .map((line) => line.replace(/^[•\-\*\u2022\d]+[\.\)\-\s]+/, ""))
                      .join("\n");
                    setCustomProductNamesText(cleaned);
                  }}
                  placeholder={`Digite ou cole as 6 categorias principais de produtos (1 por linha, apenas os nomes)...`}
                  className={`w-full p-3 rounded-xl border text-[12.5px] leading-relaxed outline-none focus:border-[#7C3AED] ${
                    dark ? "bg-[#151126] border-white/15 text-white" : "bg-white border-purple-900/15 text-[#120E24]"
                  }`}
                  data-testid="gbp-6-products-textarea"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className={`text-[11.5px] ${mutedText}`}>
              Ao clicar em <strong>Aplicar Contexto, 20 Termos e 6 Produtos</strong>, os 20 termos alimentam a Aba 02 (até 300c) e a Aba 04 (11 publicações), e os 6 produtos alimentam a Aba 03. Tudo fica salvo mesmo se você atualizar a página (F5).
            </span>
            <button
              type="button"
              disabled={loading || discoveringWeb}
              onClick={() =>
                generatePackage(activeBusiness, {
                  realNiche,
                  customContext: customDifferential,
                  tone: selectedTone,
                  useAi: true,
                })
              }
              className="px-5 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-extrabold flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
              data-testid="gbp-apply-context-btn"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              <span>{loading ? "Gerando Pacote Completo com IA..." : "Aplicar Contexto, 20 Termos e 6 Produtos (IA)"}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs for the 5 GBP Optimization Steps */}
        <div className="pt-4 flex flex-wrap items-center gap-2">
          {[
            { id: "info", label: "01. Categorias, Descricao 750c e WhatsApp", icon: FileText },
            { id: "services", label: `02. Servicos SEO (${pkg.services?.length || 0})`, icon: Tag },
            { id: "products", label: `03. Produtos (${pkg.products?.length || 0})`, icon: ShoppingBag },
            { id: "posts", label: `04. Publicacoes com Palavras-Chave (${pkg.posts?.length || 11})`, icon: Calendar },
            { id: "photos_site", label: "05. Pacote de Fotos e Pré-Tela do Site", icon: ImageIcon },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-xl text-[13px] font-semibold border flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-[#7C3AED] border-[#7C3AED] text-white shadow-sm"
                    : `${borderCol} ${subtleBg} ${mutedText} hover:text-inherit hover:border-[#7C3AED]`
                }`}
                data-testid={`gbp-pkg-tab-${t.id}`}
              >
                <Icon size={15} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB 1: CATEGORIAS, DESCRIÇÃO 750 CARACTERES & WHATSAPP */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Categories & WhatsApp Link */}
          <div className={`lg:col-span-5 rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
            <div className="flex items-center justify-between border-b pb-3 border-inherit">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                  Taxonomia Oficial Google
                </div>
                <h2 className="text-[17px] font-bold mt-0.5">Categorias Empresariais</h2>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    `${pkg.primaryCategory}, ${(pkg.additionalCategories || []).join(", ")}`,
                    "cat-header-copy",
                    "Categorias copiadas!"
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] text-[12px] font-semibold hover:bg-[#7C3AED] hover:text-white transition-colors cursor-pointer"
              >
                {copiedId === "cat-header-copy" ? "Copiado!" : "Copiar Categorias"}
              </button>
            </div>

            <div className="space-y-3">
              <div className={`p-3.5 rounded-xl border ${borderCol} ${subtleBg} flex items-center justify-between gap-2`}>
                <div>
                  <div className="text-[11px] font-bold uppercase text-[#7C3AED]">Categoria Principal</div>
                  <div className="font-bold text-[15px] mt-0.5">{pkg.primaryCategory}</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(pkg.primaryCategory, "cat-main", "Categoria principal copiada")}
                  className={`p-2 rounded-lg border ${borderCol} hover:border-[#7C3AED] cursor-pointer`}
                >
                  {copiedId === "cat-main" ? <Check size={15} className="text-[#34A853]" /> : <Copy size={15} />}
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[12px] font-semibold ${mutedText}`}>
                    Categorias Adicionais Recomendadas ({pkg.additionalCategories?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      copyText((pkg.additionalCategories || []).join(", "), "cat-all", "Todas as categorias copiadas")
                    }
                    className="text-[12px] font-semibold text-[#7C3AED] hover:underline cursor-pointer"
                  >
                    Copiar todas
                  </button>
                </div>
                <div className="space-y-2">
                  {(pkg.additionalCategories || []).map((cat, idx) => (
                    <div
                      key={idx}
                      className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between text-[13px] ${borderCol} ${subtleBg}`}
                    >
                      <span className="font-medium">{cat}</span>
                      <button
                        type="button"
                        onClick={() => copyText(cat, `cat-${idx}`, `Categoria "${cat}" copiada`)}
                        className="text-[#7C3AED] hover:opacity-80 cursor-pointer"
                      >
                        {copiedId === `cat-${idx}` ? <Check size={14} className="text-[#34A853]" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Official WhatsApp Chat URL */}
            <div className="pt-4 border-t border-inherit space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                Campo Chat / WhatsApp do Google Meu Negocio
              </div>
              <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${borderCol} ${subtleBg}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 size={16} className="text-[#7C3AED] shrink-0" />
                  <span className="font-mono text-[13px] truncate">{pkg.whatsappUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(pkg.whatsappUrl, "wa-url", "Link de WhatsApp copiado")}
                  className="px-3 py-1.5 rounded-lg bg-[#7C3AED] text-white text-[12px] font-semibold shrink-0 cursor-pointer"
                >
                  {copiedId === "wa-url" ? "Copiado" : "Copiar Link"}
                </button>
              </div>
            </div>
          </div>

          {/* 750-Character Semantic SEO Description + 3 Tone Variations */}
          <div className={`lg:col-span-7 rounded-2xl p-5 sm:p-6 space-y-4 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-inherit">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                  SEO Semantico Local · Limite Oficial 750 Caracteres
                </div>
                <h2 className="text-[17px] font-bold mt-0.5">Descricao da Empresa no Google (3 Opcoes de Tom)</h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-[12px] font-bold tabular-nums px-2.5 py-1 rounded-lg border ${borderCol} ${
                    pkg.description750.length > 750 ? "text-[#EA4335]" : "text-[#34A853]"
                  }`}
                >
                  {pkg.description750.length} / 750 caracteres
                </span>
                <button
                  type="button"
                  onClick={() => copyText(pkg.description750, "desc-750", "Descrição de 750 caracteres copiada!")}
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === "desc-750" ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedId === "desc-750" ? "Copiado!" : "Copiar Descricao"}</span>
                </button>
              </div>
            </div>

            {/* 3 Selectable Tone Variations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: "comercial", label: "Opção 1: Mais Comercial", desc: "Foco em Vendas e Orçamento" },
                { id: "persuasivo", label: "Opção 2: Mais Persuasivo", desc: "Foco em Autoridade e Liderança" },
                { id: "amigavel", label: "Opção 3: Mais Amigável", desc: "Foco em Acolhimento e Família" },
              ].map((t) => {
                const isActive = selectedTone === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTone(t.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#7C3AED]/15 border-[#7C3AED] ring-2 ring-[#7C3AED]/30"
                        : `${borderCol} ${subtleBg} hover:border-[#7C3AED]/50`
                    }`}
                    data-testid={`gbp-tone-${t.id}`}
                  >
                    <div className="text-[12.5px] font-extrabold text-[#7C3AED]">{t.label}</div>
                    <div className={`text-[11px] mt-0.5 ${mutedText}`}>{t.desc}</div>
                  </button>
                );
              })}
            </div>

            <textarea
              rows={7}
              maxLength={750}
              value={pkg.description750}
              onChange={(e) =>
                setPkg((prev) => ({
                  ...prev,
                  description750: e.target.value,
                  descriptionCharCount: e.target.value.length,
                }))
              }
              className={`w-full p-4 rounded-xl border text-[14px] leading-relaxed outline-none focus:border-[#7C3AED] ${borderCol} ${subtleBg}`}
              data-testid="gbp-description-750-textarea"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className={`text-[12px] ${mutedText}`}>
                Você pode alternar entre as 3 variações acima ou editar qualquer palavra diretamente.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyText(pkg.description750, "desc-750-bottom", "Descrição de 750 caracteres copiada!")}
                  className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[12px] font-semibold cursor-pointer"
                >
                  {copiedId === "desc-750-bottom" ? "Descrição Copiada ✓" : "Copiar Descrição (750c)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVIÇOS OTIMIZADOS COM PALAVRAS-CHAVE LOCAIS (ATÉ 20 SERVIÇOS · 300 CARACTERES) */}
      {activeTab === "services" && (
        <section className={`rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                Estrategia de Palavras-Chave em Servicos · Limite 300 Caracteres por Servico
              </div>
              <h2 className="text-[19px] font-bold mt-0.5">
                Servicos Otimizados para o Google Meu Negocio ({pkg.services?.length || 0})
              </h2>
              <p className={`text-[13px] ${mutedText}`}>
                Ao editar o título de um serviço aqui, o título correspondente na Aba 04 (Publicações) é atualizado automaticamente.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={regeneratingBatch === "services"}
                onClick={() => handleRegenerateBatch("services")}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[13px] font-extrabold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                data-testid="regenerate-all-services-ai-btn"
              >
                <Sparkles size={14} className={regeneratingBatch === "services" ? "animate-spin" : ""} />
                <span>
                  {regeneratingBatch === "services"
                    ? "Regenerando 20 Serviços..."
                    : "Regenerar Todos com IA"}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    (pkg.services || []).map((s, i) => `${i + 1}. ${s.name}\n${s.description}`).join("\n\n"),
                    "copy-all-services",
                    "Todos os 20 serviços copiados!"
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-semibold shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <Copy size={14} />
                <span>{copiedId === "copy-all-services" ? "20 Serviços Copiados ✓" : "Copiar Todos os Serviços"}</span>
              </button>
            </div>
          </div>

          {/* Add new custom service inline */}
          <form onSubmit={handleAddService} className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-12 gap-3 ${borderCol} ${subtleBg}`}>
            <div className="md:col-span-4">
              <input
                type="text"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                placeholder="Nome do Serviço / Palavra-Chave (ex: Cozinha Sob Medida em Anápolis)"
                className={`w-full px-3.5 py-2 rounded-lg border text-[13px] outline-none ${borderCol} ${dark ? "bg-[#303134]" : "bg-white"}`}
              />
            </div>
            <div className="md:col-span-6">
              <input
                type="text"
                maxLength={300}
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                placeholder="Descrição de até 300 caracteres (deixe em branco para gerar automaticamente)..."
                className={`w-full px-3.5 py-2 rounded-lg border text-[13px] outline-none ${borderCol} ${dark ? "bg-[#303134]" : "bg-white"}`}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full h-full py-2 px-3 rounded-lg bg-[#7C3AED] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(pkg.services || []).map((svc, idx) => {
              const isRegenerating = regeneratingKey === `service-${idx}`;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 ${borderCol} ${subtleBg}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#7C3AED]">
                        SERVICO #{String(idx + 1).padStart(2, "0")} · {svc.category || pkg.primaryCategory}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[11px] tabular-nums ${(svc.description || "").length > 300 ? "text-red-500 font-bold" : mutedText}`}>
                          {(svc.description || "").length}/300c
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem("service", idx)}
                          title="Excluir este serviço/termo"
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Título do Serviço / Palavra-Chave:</label>
                      <input
                        type="text"
                        value={svc.name || ""}
                        onChange={(e) => handleUpdateItem("service", idx, { name: e.target.value })}
                        className={`w-full font-bold text-[14px] px-2.5 py-1.5 rounded-lg border outline-none focus:border-[#7C3AED] ${borderCol} ${
                          dark ? "bg-[#303134]" : "bg-white"
                        }`}
                        placeholder="Nome do serviço..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-500">Descrição Comercial (até 300c):</label>
                        <button
                          type="button"
                          disabled={isRegenerating}
                          onClick={() => handleRegenerateItem("service", idx, svc.name)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:text-[#5B21B6] cursor-pointer disabled:opacity-50"
                          title="Gera uma descrição persuasiva de até 300 caracteres a partir do título editado acima sem alterar outros itens"
                        >
                          <Sparkles size={12} className={isRegenerating ? "animate-spin" : ""} />
                          <span>{isRegenerating ? "Gerando..." : "Gerar descrição pelo título"}</span>
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        maxLength={300}
                        value={svc.description || ""}
                        onChange={(e) => handleUpdateItem("service", idx, { description: e.target.value })}
                        className={`w-full text-[12.5px] leading-relaxed p-2.5 rounded-lg border outline-none resize-none focus:border-[#7C3AED] ${borderCol} ${
                          dark ? "bg-[#303134]" : "bg-white"
                        }`}
                        placeholder="Descrição do serviço..."
                      />
                    </div>
                  </div>

                  <div className={`pt-2.5 border-t ${borderCol} flex items-center justify-between gap-2`}>
                    <button
                      type="button"
                      onClick={() => copyText(svc.name, `svc-name-${idx}`, `Título "${svc.name}" copiado`)}
                      className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer ${borderCol} ${
                        dark ? "bg-[#303134]" : "bg-white"
                      }`}
                    >
                      {copiedId === `svc-name-${idx}` ? <Check size={13} className="text-[#34A853]" /> : <Copy size={13} />}
                      <span>Copiar Titulo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText(svc.description, `svc-desc-${idx}`, "Descrição de 300c copiada")}
                      className="px-3.5 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#1557B0] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === `svc-desc-${idx}` ? <Check size={13} /> : <Copy size={13} />}
                      <span>Copiar Descrição</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 3: CATÁLOGO DE PRODUTOS GBP */}
      {activeTab === "products" && (
        <section className={`rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                Vitrine de Produtos no Perfil da Empresa · Até 1.000 Caracteres por Ficha
              </div>
              <h2 className="text-[19px] font-bold mt-0.5">
                Categorias e Produtos Estruturados ({pkg.products?.length || 0})
              </h2>
              <p className={`text-[13px] ${mutedText}`}>
                Edite individualmente qualquer título ou gere a ficha técnica comercial de até 1.000 caracteres por produto.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
                data-testid="add-custom-product-btn"
              >
                <Plus size={14} />
                <span>Adicionar Produto</span>
              </button>
              <button
                type="button"
                disabled={regeneratingBatch === "products"}
                onClick={() => handleRegenerateBatch("products")}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[13px] font-extrabold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                data-testid="regenerate-all-products-ai-btn"
              >
                <Sparkles size={14} className={regeneratingBatch === "products" ? "animate-spin" : ""} />
                <span>
                  {regeneratingBatch === "products"
                    ? "Regenerando Produtos..."
                    : "Regenerar Todos com IA"}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    (pkg.products || []).map((p, i) => `${i + 1}. ${p.name} (${p.category})\n${p.description}`).join("\n\n"),
                    "copy-all-products",
                    "Todos os produtos copiados!"
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Copy size={14} />
                <span>{copiedId === "copy-all-products" ? "Produtos Copiados ✓" : "Copiar Todos os Produtos"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(pkg.products || []).map((prod, idx) => {
              const isRegenerating = regeneratingKey === `product-${idx}`;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between gap-3.5 ${borderCol} ${subtleBg}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#7C3AED]">
                        {prod.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-[#34A853] bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                          {prod.priceLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem("product", idx)}
                          title="Excluir este produto"
                          className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Nome do Produto:</label>
                      <input
                        type="text"
                        value={prod.name || ""}
                        onChange={(e) => handleUpdateItem("product", idx, { name: e.target.value })}
                        className={`w-full font-bold text-[14px] px-2.5 py-1.5 rounded-lg border outline-none focus:border-[#7C3AED] ${borderCol} ${
                          dark ? "bg-[#303134]" : "bg-white"
                        }`}
                        placeholder="Nome do produto..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-500">Descrição Técnica (até 1.000c):</label>
                        <button
                          type="button"
                          disabled={isRegenerating}
                          onClick={() => handleRegenerateItem("product", idx, prod.name)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:text-[#5B21B6] cursor-pointer disabled:opacity-50"
                          title="Gera a descrição detalhada a partir do título do produto"
                        >
                          <Sparkles size={12} className={isRegenerating ? "animate-spin" : ""} />
                          <span>{isRegenerating ? "Gerando..." : "Gerar pelo título"}</span>
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        maxLength={1000}
                        value={prod.description || ""}
                        onChange={(e) => handleUpdateItem("product", idx, { description: e.target.value })}
                        className={`w-full text-[12px] leading-relaxed p-2.5 rounded-lg border outline-none resize-none focus:border-[#7C3AED] ${borderCol} ${
                          dark ? "bg-[#303134]" : "bg-white"
                        }`}
                        placeholder="Descrição do produto..."
                      />
                    </div>
                  </div>

                  <div className={`pt-2.5 border-t ${borderCol} flex items-center justify-between gap-2`}>
                    <span className="font-mono text-[11px] font-bold text-[#34A853]">
                      {(prod.description || "").length} / 1.000c
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyText(prod.name, `prod-n-${idx}`, "Título copiado")}
                        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${borderCol} hover:bg-slate-50 dark:hover:bg-slate-800`}
                      >
                        <Copy size={12} /> Título
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(prod.description, `prod-d-${idx}`, "Descrição copiada")}
                        className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#1557B0] text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy size={12} /> Texto
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 4: 10 PUBLICAÇÕES AGENDADAS (ATÉ 1.500 CARACTERES + BOTÃO LIGAR AGORA) */}
      {activeTab === "posts" && (
        <section className={`rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                Cronograma de Atualizações GBP · Publicações Estratégicas (Até 1.500 Caracteres)
              </div>
              <h2 className="text-[19px] font-bold mt-0.5">
                {pkg.posts?.length || 10} Publicações Prontas com Agendamento e Botão de Ligação
              </h2>
              <p className={`text-[13px] ${mutedText}`}>
                Edite títulos ou textos de qualquer post individualmente com preservação total de outros itens.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={regeneratingBatch === "posts"}
                onClick={() => handleRegenerateBatch("posts")}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-[13px] font-extrabold cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                data-testid="regenerate-all-posts-ai-btn"
              >
                <Sparkles size={14} className={regeneratingBatch === "posts" ? "animate-spin" : ""} />
                <span>
                  {regeneratingBatch === "posts"
                    ? "Regenerando Publicações..."
                    : "Regenerar Todas com IA"}
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  copyText(
                    (pkg.posts || []).map((pt) => `Post #${pt.number} — ${pt.title}\n${pt.text}`).join("\n\n---\n\n"),
                    "copy-all-posts",
                    "Todas as publicações copiadas!"
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-semibold cursor-pointer flex items-center gap-1.5"
              >
                <Copy size={14} />
                <span>{copiedId === "copy-all-posts" ? "Publicações Copiadas ✓" : "Copiar Todas as Publicações"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(pkg.posts || []).map((post, idx) => {
              const isRegenerating = regeneratingKey === `post-${idx}`;
              return (
                <div
                  key={post.number || idx}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-3 ${borderCol} ${subtleBg}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold uppercase text-[#7C3AED]">
                        PUBLICAÇÃO #{String(post.number || idx + 1).padStart(2, "0")} · {post.objective}
                      </span>
                      <span className="text-[11px] font-mono font-semibold tabular-nums text-[#34A853]">
                        Agendar: {post.scheduledDate}
                      </span>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Título do Post:</label>
                      <input
                        type="text"
                        value={post.title || ""}
                        onChange={(e) => handleUpdateItem("post", idx, { title: e.target.value })}
                        className={`w-full font-bold text-[14px] px-2.5 py-1.5 rounded-lg border outline-none focus:border-[#7C3AED] ${borderCol} ${
                          dark ? "bg-[#303134]" : "bg-white"
                        }`}
                        placeholder="Título da publicação..."
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <label className="text-[11px] font-semibold text-slate-500">Texto Completo (até 1.500c):</label>
                        <button
                          type="button"
                          disabled={isRegenerating}
                          onClick={() => handleRegenerateItem("post", idx, post.title)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:text-[#5B21B6] cursor-pointer disabled:opacity-50"
                          title="Regenera o texto do post a partir do título editado"
                        >
                          <Sparkles size={12} className={isRegenerating ? "animate-spin" : ""} />
                          <span>{isRegenerating ? "Regenerando..." : "Regenerar texto do post"}</span>
                        </button>
                      </div>
                      <textarea
                        rows={5}
                        maxLength={1500}
                        value={post.text || ""}
                        onChange={(e) =>
                          handleUpdateItem("post", idx, { text: e.target.value, charCount: e.target.value.length })
                        }
                        className={`w-full text-[12px] leading-relaxed p-2.5 rounded-lg border outline-none resize-none focus:border-[#7C3AED] ${borderCol} ${
                          dark ? "bg-[#303134]" : "bg-white"
                        }`}
                        placeholder="Conteúdo do post..."
                      />
                    </div>

                    <div className={`text-[11.5px] space-y-1 ${mutedText}`}>
                      <div>
                        <strong className={dark ? "text-[#E8EAED]" : "text-[#202124]"}>Direção da Foto: </strong>
                        {post.imageDirection}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#7C3AED]">
                          <PhoneCall size={12} /> Botão CTA: {post.ctaType} ({post.ctaPhone})
                        </span>
                        <span className="font-mono tabular-nums">{(post.text || "").length} / 1500 caracteres</span>
                      </div>
                    </div>
                  </div>

                  <div className={`pt-3 border-t ${borderCol} flex items-center justify-between gap-2`}>
                    <button
                      type="button"
                      onClick={() => copyText(post.title, `post-title-${post.number || idx}`, `Título do Post #${post.number || idx + 1} copiado`)}
                      className={`px-3 py-2 rounded-xl border text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer ${borderCol}`}
                    >
                      {copiedId === `post-title-${post.number || idx}` ? <Check size={13} className="text-[#34A853]" /> : <Copy size={13} />}
                      <span>Copiar Título</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyText(post.text, `post-${post.number || idx}`, `Texto do Post #${post.number || idx + 1} copiado`)}
                      className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedId === `post-${post.number || idx}` ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === `post-${post.number || idx}` ? "Copiado!" : "Copiar Texto do Post"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 5: PACOTE VISUAL DE IMAGENS & PRÉ-TELA COMPLETA DO SITE EXPRESS */}
      {activeTab === "photos_site" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Visual Image Package Manager (Upload + AI Generation + SEO Renaming) */}
          <div className={`lg:col-span-5 rounded-2xl p-5 sm:p-6 space-y-4 ${cardClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-inherit">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7C3AED]">
                  Pacote de Imagens da Ficha & do Site
                </div>
                <h2 className="text-[17px] font-bold mt-0.5">Fotos Reais + Estúdio IA com SEO Automático</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={fetchingRealPhotos}
                  onClick={() =>
                    fetchRealGooglePhotosForBusiness(
                      activeBusiness,
                      userPhotos.map((p) => p.url),
                      false
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-[#7C3AED] dark:text-purple-300 text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
                  title="Buscar fotos reais oficiais da ficha do Google Maps desta empresa"
                >
                  <RefreshCw size={13} className={fetchingRealPhotos ? "animate-spin" : ""} />
                  <span>{fetchingRealPhotos ? "Buscando no Maps..." : "Puxar Fotos Reais"}</span>
                </button>
                <button
                  type="button"
                  disabled={generatingAiPhoto}
                  onClick={handleGenerateAiPhotoForPackage}
                  className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#5B21B6] text-white text-[12px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
                >
                  <Sparkles size={13} className={generatingAiPhoto ? "animate-spin" : ""} />
                  <span>{generatingAiPhoto ? "Gerando..." : "Gerar Foto IA"}</span>
                </button>
              </div>
            </div>

            <p className={`text-[12.5px] leading-relaxed ${mutedText}`}>
              Adicione fotos do computador, use as fotos reais da ficha ou gere fotos comerciais com IA. Cada imagem já recebe automaticamente o nome de arquivo otimizado com a palavra-chave local para subir no Google Meu Negócio e vai direto para o seu Site Express.
            </p>

            {/* Upload & AI Photo Bar */}
            <div className="p-3.5 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-700/60 bg-purple-50/40 dark:bg-purple-950/20 flex flex-wrap items-center justify-between gap-3">
              <div className="text-left">
                <div className="text-[12.5px] font-bold">Enviar Fotos do Computador</div>
                <div className={`text-[11px] ${mutedText}`}>
                  Suporta múltiplas fotos (PNG, JPG, WebP) com renomeação SEO automática
                </div>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[12px] font-bold cursor-pointer shrink-0 transition-colors">
                <Upload size={14} />
                <span>Enviar Fotos</span>
                <input
                  type="file"
                  multiple
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    files.forEach((file, fileIdx) => {
                      const r = new FileReader();
                      r.onload = () => {
                        setUserPhotos((prev) => {
                          const targetIdx = prev.length + fileIdx;
                          const targetName =
                            pkg.photoSeoNames?.[targetIdx % (pkg.photoSeoNames?.length || 1)] ||
                            `foto-seo-${targetIdx + 1}.jpg`;
                          const svcLabel =
                            pkg.services?.[targetIdx % (pkg.services?.length || 1)]?.name || "Foto da Empresa";
                          return [
                            ...prev,
                            {
                              url: r.result,
                              seoName: targetName,
                              label: svcLabel,
                              selectedForSite: true,
                            },
                          ];
                        });
                      };
                      r.readAsDataURL(file);
                    });
                    toast.success(`${files.length} foto(s) adicionada(s) ao pacote visual e pré-selecionada(s) para o site!`);
                  }}
                />
              </label>
            </div>

            {/* Visual Photo Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {userPhotos.map((p, i) => {
                const seoFilename =
                  pkg.photoSeoNames?.[i % (pkg.photoSeoNames?.length || 1)] || p.seoName || `foto-seo-${i + 1}.jpg`;
                return (
                  <div
                    key={`${p.url}-${i}`}
                    className={`p-2.5 rounded-xl border ${borderCol} ${subtleBg} flex flex-col justify-between gap-2`}
                  >
                    <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-[16/10]">
                      <img
                        src={p.url}
                        alt={seoFilename}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={() => {
                          // Automatically strip any image URL that fails to load in browser so broken image icons never appear
                          setUserPhotos((prev) => prev.filter((item) => item.url !== p.url));
                        }}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white text-[10px] font-bold">
                        {i === 0 ? "Capa Hero" : `Foto #${i + 1}`}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setUserPhotos((prev) =>
                            prev.map((item, idx) =>
                              idx === i ? { ...item, selectedForSite: item.selectedForSite === false ? true : false } : item
                            )
                          )
                        }
                        className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                          p.selectedForSite !== false ? "bg-emerald-600 text-white" : "bg-slate-800/80 text-slate-300"
                        }`}
                      >
                        {p.selectedForSite !== false ? "No Site ✓" : "Oculta"}
                      </button>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold truncate">{p.label || `Imagem SEO #${i + 1}`}</div>
                      <div className="text-[10px] font-mono text-[#7C3AED] truncate" title={seoFilename}>
                        {seoFilename}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-inherit">
                      <a
                        href={p.url}
                        download={seoFilename}
                        className="flex-1 py-1 px-2 rounded-lg bg-[#7C3AED]/10 hover:bg-[#7C3AED] text-[#7C3AED] hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Download size={12} /> Baixar c/ SEO
                      </a>
                      <button
                        type="button"
                        onClick={() => setUserPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                        className="py-1 px-2 rounded-lg border border-red-500/30 text-red-500 text-[11px] font-semibold hover:bg-red-500/10 cursor-pointer"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Complete Interactive Pre-Screen Preview of the Site Express */}
          <div className={`lg:col-span-7 rounded-2xl p-5 sm:p-6 space-y-5 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-inherit">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#34A853]">
                  Pré-Tela Interativa · Conferência Completa Antes de Gerar o Site
                </div>
                <h2 className="text-[18px] font-extrabold mt-0.5">
                  Tudo que Vai para o Site Express de {String(pkg.businessName || "").split("|")[0].trim()}
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11.5px] font-bold">
                100% Editável Antes de Publicar
              </span>
            </div>

            {pkg.siteBriefing && (
              <div className="space-y-4">
                {/* Visual Mini-Hero Preview Card + Photo Strip */}
                <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-slate-950 text-white p-5 sm:p-6">
                  {userPhotos[0]?.url && (
                    <img
                      src={userPhotos[0].url}
                      alt={pkg.businessName}
                      referrerPolicy="no-referrer"
                      className="absolute inset-0 w-full h-full object-cover opacity-35"
                    />
                  )}
                  <div className="relative z-10 space-y-2">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-[#7C3AED] text-white text-[10.5px] font-extrabold uppercase tracking-wider">
                      {pkg.primaryCategory} · {pkg.city}/{pkg.uf}
                    </span>
                    <h3 className="text-[20px] sm:text-[22px] font-extrabold leading-tight">
                      {pkg.siteBriefing.heroHeadline}
                    </h3>
                    <p className="text-[12.5px] text-slate-200 line-clamp-2">{pkg.siteBriefing.heroSubheadline}</p>
                    <div className="pt-2 flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-extrabold">
                        WhatsApp: {pkg.phone}
                      </span>
                      <span className="px-3 py-1.5 rounded-lg bg-white/15 text-white font-semibold">
                        {userPhotos.filter((p) => p.selectedForSite !== false).length} Fotos Selecionadas para o Site
                      </span>
                    </div>

                    {userPhotos.filter((p) => p.selectedForSite !== false).length > 1 && (
                      <div className="pt-2 flex items-center gap-2 overflow-x-auto">
                        {userPhotos
                          .filter((p) => p.selectedForSite !== false)
                          .map((ph, idx) => (
                            <img
                              key={idx}
                              src={ph.url}
                              alt={ph.label || `Foto ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-14 h-10 rounded-lg object-cover border border-white/30 shrink-0"
                            />
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Editable Hero Headline & Subtitle with AI Polish Button */}
                <div className={`p-4 rounded-xl border space-y-3 ${borderCol} ${subtleBg}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#7C3AED]">
                      Textos Principais da Capa (Hero)
                    </span>
                    <button
                      type="button"
                      disabled={regeneratingBatch === "hero_copy"}
                      onClick={() => handleRegenerateBatch("hero_copy")}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#7C3AED]/15 hover:bg-[#7C3AED] text-[#7C3AED] hover:text-white text-[11.5px] font-extrabold transition-colors cursor-pointer disabled:opacity-50"
                      data-testid="regenerate-hero-copy-ai-btn"
                    >
                      <Sparkles size={12} className={regeneratingBatch === "hero_copy" ? "animate-spin" : ""} />
                      <span>
                        {regeneratingBatch === "hero_copy"
                          ? "Melhorando com IA..."
                          : "Melhorar Título & Subtítulo com IA"}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-[#7C3AED] block mb-1">
                      1. Título Principal da Capa do Site (Hero Headline):
                    </label>
                    <input
                      type="text"
                      value={pkg.siteBriefing.heroHeadline || ""}
                      onChange={(e) =>
                        setPkg((prev) => ({
                          ...prev,
                          siteBriefing: { ...prev.siteBriefing, heroHeadline: e.target.value },
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-lg border text-[13.5px] font-bold outline-none focus:border-[#7C3AED] ${borderCol} ${
                        dark ? "bg-[#151126]" : "bg-white"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold uppercase text-[#7C3AED] block mb-1">
                      2. Subtítulo de Conversão e Apresentação:
                    </label>
                    <textarea
                      rows={2}
                      value={pkg.siteBriefing.heroSubheadline || ""}
                      onChange={(e) =>
                        setPkg((prev) => ({
                          ...prev,
                          siteBriefing: { ...prev.siteBriefing, heroSubheadline: e.target.value },
                        }))
                      }
                      className={`w-full px-3 py-2 rounded-lg border text-[12.5px] outline-none focus:border-[#7C3AED] ${borderCol} ${
                        dark ? "bg-[#151126]" : "bg-white"
                      }`}
                    />
                  </div>
                </div>

                {/* Interactive Checklist of Services & Products Going to the Site */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`p-3.5 rounded-xl border ${borderCol} ${subtleBg} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-[#7C3AED]">
                        3. Serviços no Site ({(pkg.services || []).filter((s) => s.selectedForSite !== false).length} selecionados)
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("services")}
                        className="text-[11px] font-bold text-[#7C3AED] hover:underline cursor-pointer"
                      >
                        Editar na Aba 02
                      </button>
                    </div>
                    <div className="space-y-1.5 text-[12px] max-h-[210px] overflow-y-auto pr-1">
                      {(pkg.services || []).map((s, idx) => {
                        const checked = s.selectedForSite !== false;
                        return (
                          <label
                            key={idx}
                            className="flex items-center gap-2 cursor-pointer hover:opacity-90 py-0.5"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                handleUpdateItem("service", idx, { selectedForSite: e.target.checked })
                              }
                              className="rounded accent-[#7C3AED] shrink-0"
                            />
                            <span className={`font-semibold truncate ${checked ? "" : "line-through opacity-50"}`}>
                              {s.name}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className={`p-3.5 rounded-xl border ${borderCol} ${subtleBg} space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold uppercase text-[#7C3AED]">
                        4. Vitrine de Produtos no Site ({(pkg.products || []).filter((p) => p.selectedForSite !== false).length} selecionados)
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("products")}
                        className="text-[11px] font-bold text-[#7C3AED] hover:underline cursor-pointer"
                      >
                        Editar na Aba 03
                      </button>
                    </div>
                    <div className="space-y-1.5 text-[12px] max-h-[210px] overflow-y-auto pr-1">
                      {(pkg.products || []).map((p, idx) => {
                        const checked = p.selectedForSite !== false;
                        return (
                          <label
                            key={idx}
                            className="flex items-center justify-between gap-1.5 cursor-pointer hover:opacity-90 py-0.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  handleUpdateItem("product", idx, { selectedForSite: e.target.checked })
                                }
                                className="rounded accent-[#7C3AED] shrink-0"
                              />
                              <span className={`font-semibold truncate ${checked ? "" : "line-through opacity-50"}`}>
                                {p.name}
                              </span>
                            </div>
                            <span className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 shrink-0">
                              {p.priceLabel}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                onOpenSiteExpressWithBriefing &&
                onOpenSiteExpressWithBriefing(activeBusiness, {
                  ...pkg,
                  customPhotos: userPhotos.filter((p) => p.selectedForSite !== false).map((p) => p.url),
                })
              }
              className="w-full py-4 px-5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#16A34A] hover:opacity-95 text-white font-extrabold text-[15px] flex items-center justify-center gap-2 shadow-lg cursor-pointer"
              data-testid="build-site-express-from-preview-btn"
            >
              <Layers size={18} />
              <span>Construir Site Express Agora com estes Textos, Produtos e Fotos</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
