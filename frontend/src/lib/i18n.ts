/**
 * IP-SAKTI Sahayak — Complete UI Internationalisation (i18n)
 * Supports: English (EN), Hindi (HI), Marathi (MR)
 *
 * Usage:
 *   import { t } from '@/lib/i18n';
 *   t('analyze_btn', 'HI') // => 'विश्लेषण करें'
 */

import { SupportedLanguage } from '@/types/domain';

type TranslationKey =
  // Dashboard — Search View
  | 'page_hero_title'
  | 'page_hero_subtitle'
  | 'placeholder_query'
  | 'analyze_btn'
  | 'test_scenarios_label'
  // Dashboard — Processing View
  | 'processing_title'
  | 'processing_step1'
  | 'processing_step2'
  | 'processing_step3'
  | 'processing_step4'
  // Dashboard — Verdict Toolbar
  | 'back_to_search'
  | 'escalate_btn'
  | 'ask_followup_btn'
  | 'export_pdf_btn'
  | 'jurisdiction_india'
  | 'jurisdiction_wipo'
  // Dashboard — Verdict Header
  | 'jurisdiction_mode_label'
  | 'jurisdiction_india_full'
  | 'jurisdiction_wipo_full'
  | 'read_aloud_btn'
  | 'reading_btn'
  | 'confidence_label'
  | 'audit_label'
  | 'botanicals_label'
  | 'precedent_label'
  | 'examiner_label'
  | 'examiner_show_btn'
  | 'examiner_hide_btn'
  | 'reasoning_section_title'
  | 'view_citation_btn'
  | 'nli_verified_label'
  // Dashboard — Viable Routes
  | 'routes_section_title'
  | 'actionable_steps_label'
  | 'escalate_facilitator_btn'
  // Dashboard — Jurisdiction Diff
  | 'diff_engine_title'
  | 'diff_india_label'
  | 'diff_us_label'
  | 'diff_epo_label'
  | 'diff_india_point1'
  | 'diff_india_point2'
  | 'diff_us_point1'
  | 'diff_us_point2'
  | 'diff_epo_point1'
  | 'diff_epo_point2'
  // Dashboard — Abstention View
  | 'abstention_title'
  | 'abstention_guardrail_label'
  | 'abstention_query_label'
  | 'escalation_routing_title'
  | 'escalation_generate_btn'
  | 'escalation_notice'
  | 'escalation_link_ipo'
  | 'escalation_link_ayush'
  | 'audit_trail_label'
  | 'dpdp_compliant_label'
  | 'txn_id_label'
  | 'timestamp_label'
  | 'hash_label'
  // Dashboard — Citation Vault Modal
  | 'citation_vault_title'
  | 'statutory_source_label'
  | 'legislation_version_label'
  | 'sha_hash_label'
  | 'india_code_link'
  | 'statutory_meaning_label'
  // Dashboard — Floating / Footer
  | 'ask_assistant_btn'
  | 'footer_text'
  | 'legal_notice_label'
  | 'legal_notice_text'
  | 'dpdp_tag'
  // Common severity badges
  | 'severity_barred'
  | 'severity_approval_required'
  | 'severity_disclosure_mandate'
  | 'severity_conditionally_viable'
  // App Header / Sidebar
  | 'statutory_rag_label'
  | 'ministry_badge'
  // Hardcoded brain step titles
  | 'step_3p_title'
  | 'step_3e_title'
  | 'step_3d_process_title'
  | 'step_3d_title'
  | 'step_bda6_title'
  | 'step_bda7_title'
  | 'step_bda3_title'
  | 'step_s10_title'
  | 'step_gratk3_title'
  | 'step_gratk4_title'
  | 'step_3p_generic_title'
  | 'step_3e_generic_title'
  // Legal disclaimer banner
  | 'legal_notice_bold'
  | 'dpdp_non_pii'
  | 'footer_zero_retention'
  | 'footer_sha256'
  // Follow-Up Chat
  | 'chat_title'
  | 'chat_grounded_label'
  | 'chat_subtitle'
  | 'chat_context_prefix'
  | 'chat_welcome_title'
  | 'chat_welcome_sub'
  | 'chat_loading'
  | 'chat_placeholder'
  | 'chat_footer_hint'
  | 'chat_citations_label'
  | 'chat_copy'
  | 'chat_copied'
  | 'chat_clear'
  // Facilitator Modal
  | 'facilitator_modal_title'
  | 'facilitator_modal_subtitle'
  | 'facilitator_preprosecution_title'
  | 'facilitator_preprosecution_body'
  | 'facilitator_innovator_label'
  | 'facilitator_entity_label'
  | 'facilitator_dossier_id_label'
  | 'facilitator_claim_label'
  | 'facilitator_mandates_label'
  | 'facilitator_checklist_title'
  | 'facilitator_directories_title'
  | 'facilitator_link_ip'
  | 'facilitator_link_ayush'
  | 'facilitator_copy'
  | 'facilitator_copied'
  | 'facilitator_download';

const translations: Record<TranslationKey, Record<SupportedLanguage, string>> = {
  // ─── Search View ────────────────────────────────────────────────────────────
  page_hero_title: {
    EN: 'Instant Statutory Patent & IP Guidance for Ayurveda',
    HI: 'आयुर्वेद हेतु त्वरित पेटेंट एवं आईपी मार्गदर्शन',
    MR: 'आयुर्वेदासाठी त्वरित पेटंट व आयपी मार्गदर्शन',
    SA: 'आयुर्वेदस्य त्वरितपटण्टं च आईपी मार्गदर्शनम्',
  },
  page_hero_subtitle: {
    EN: 'Citation-grounded retrieval assistant for classical & proprietary formulators. Grounded in the Indian Patents Act, Biological Diversity Act 2023, and WIPO GRATK Treaty.',
    HI: 'शास्त्रीय और स्वामित्व सूत्रकारों के लिए उद्धरण-आधारित पुनर्प्राप्ति सहायक। भारतीय पेटेंट अधिनियम, जैविक विविधता अधिनियम 2023 और WIPO GRATK संधि पर आधारित।',
    MR: 'शास्त्रीय व मालकीहक्क सूत्रकर्त्यांसाठी संदर्भ-आधारित पुनर्प्राप्ती सहाय्यक। भारतीय पेटंट कायदा, जैवविविधता कायदा 2023 आणि WIPO GRATK करारावर आधारित।',
    SA: 'शास्त्रीयानां स्वामित्विनां च सूत्रकर्तृणां उद्धरणाधारितान्वेषणसहायकम्। भारतीयपटण्टअधिनियमे, जैवविविधताअधिनियमे २०२३ च WIPO GRATK सन्धौ च प्रतिष्ठितम्।',
  },
  placeholder_query: {
    EN: 'E.g., I want to patent a formulation of Haridra and Maricha for joint pain.',
    HI: 'उदा. मैं जोड़ों के दर्द के लिए हल्दी और काली मिर्च का पेटेंट कराना चाहता हूँ।',
    MR: 'उदा. मला सांधेदुखीसाठी हळद आणि मिरी यांचे पेटंट घ्यायचे आहे.',
    SA: 'उदाहरतः अहं हरिद्रायाः मरिचश्च सन्धिवातार्थं नवीनसूत्रं पटण्टीकर्तुम् इच्छामि।',
  },
  analyze_btn: {
    EN: 'Analyze Intent',
    HI: 'विश्लेषण करें',
    MR: 'विश्लेषण करा',
    SA: 'अभिप्रायं विश्लेषयतु',
  },
  test_scenarios_label: {
    EN: 'Test Scenarios:',
    HI: 'परीक्षण परिदृश्य:',
    MR: 'चाचणी परिस्थिती:',
    SA: 'परीक्षणपरिस्थितयः',
  },
  // ─── Processing View ────────────────────────────────────────────────────────
  processing_title: {
    EN: 'Analyzing Statutory Corpus...',
    HI: 'वैधानिक कॉर्पस का विश्लेषण हो रहा है...',
    MR: 'वैधानिक कॉर्पसचे विश्लेषण चालू आहे...',
    SA: 'वैधानिककॉर्पस्य विश्लेषणं वर्तते...',
  },
  processing_step1: {
    EN: '✓ Scrubbing client identifiers under DPDP Act 2023...',
    HI: '✓ DPDP अधिनियम 2023 के अंतर्गत क्लाइंट पहचानकर्ता हटाए जा रहे हैं...',
    MR: '✓ DPDP कायदा 2023 अंतर्गत ग्राहक ओळखकर्ते काढले जात आहेत...',
    SA: '✓ DPDP अधिनियमे २०२३ अन्तर्गत क्लाइंटपरिचायकानि अपह्रियन्ते...',
  },
  processing_step2: {
    EN: '✓ Resolving Sanskrit & Vernacular Botanical Taxonomy (Curcuma longa, Piper nigrum)...',
    HI: '✓ संस्कृत और क्षेत्रीय वनस्पति वर्गीकरण हल हो रहा है (Curcuma longa, Piper nigrum)...',
    MR: '✓ संस्कृत आणि प्रादेशिक वनस्पतिशास्त्रीय वर्गीकरण सोडवले जात आहे...',
    SA: '✓ संस्कृतप्रादेशिकच वनस्पतिवर्गीकरणं सम्यग्गृह्यते (कुर्कुमा लोंगा, पाइपर नाइग्रम)...',
  },
  processing_step3: {
    EN: '✓ Evaluating Section 3(p) Traditional Knowledge Bar & AFI Formulary...',
    HI: '✓ धारा 3(p) पारंपरिक ज्ञान बाधा और AFI सूत्रावली का मूल्यांकन हो रहा है...',
    MR: '✓ कलम 3(p) पारंपरिक ज्ञान बंदी आणि AFI सूत्रावलीचे मूल्यमापन होत आहे...',
    SA: '✓ धारा ३(प) पारंपरिकज्ञानबाधा च AFI सूत्रावली च मूल्यांकनं वर्तते...',
  },
  processing_step4: {
    EN: '✓ Checking Biological Diversity Act 2023 Sec 6 NBA Form III compliance...',
    HI: '✓ जैविक विविधता अधिनियम 2023 धारा 6 NBA फॉर्म III अनुपालन की जाँच हो रही है...',
    MR: '✓ जैवविविधता कायदा 2023 कलम 6 NBA फॉर्म III अनुपालन तपासले जात आहे...',
    SA: '✓ जैवविविधताअधिनियमे २०२३ धारा ६ NBA फॉर्म III अनुपालनं परीक्ष्यते...',
  },
  // ─── Verdict Toolbar ────────────────────────────────────────────────────────
  back_to_search: {
    EN: 'Back to Search',
    HI: 'खोज पर वापस जाएँ',
    MR: 'शोधाकडे परत जा',
    SA: 'अन्वेषणाय प्रतिगच्छतु',
  },
  escalate_btn: {
    EN: 'Escalate to Human Facilitator',
    HI: 'मानव सुविधाकर्ता को अग्रेषित करें',
    MR: 'मानव सुलभकर्त्याकडे पाठवा',
    SA: 'मानवसुलभकर्तृप्रति प्रेषयतु',
  },
  ask_followup_btn: {
    EN: 'Ask Follow-up',
    HI: 'अनुवर्ती प्रश्न पूछें',
    MR: 'पुढील प्रश्न विचारा',
    SA: 'अनुवर्तीप्रश्नं पृच्छतु',
  },
  export_pdf_btn: {
    EN: 'Export Multilingual PDF',
    HI: 'बहुभाषी PDF निर्यात करें',
    MR: 'बहुभाषी PDF निर्यात करा',
    SA: 'बहुभाषी PDF निर्यातयतु',
  },
  jurisdiction_india: {
    EN: '🇮🇳 Indian Regime',
    HI: '🇮🇳 भारतीय व्यवस्था',
    MR: '🇮🇳 भारतीय व्यवस्था',
    SA: '🇮🇳 भारतीयव्यवस्था',
  },
  jurisdiction_wipo: {
    EN: '🌐 International (WIPO)',
    HI: '🌐 अंतर्राष्ट्रीय (WIPO)',
    MR: '🌐 आंतरराष्ट्रीय (WIPO)',
    SA: '🌐 आंतरराष्ट्रीयम् (WIPO)',
  },
  // ─── Verdict Header ─────────────────────────────────────────────────────────
  jurisdiction_mode_label: {
    EN: 'Jurisdiction Mode:',
    HI: 'न्यायाधिकार क्षेत्र:',
    MR: 'न्यायक्षेत्र:',
    SA: 'न्यायाधिकारक्षेत्रम्',
  },
  jurisdiction_india_full: {
    EN: 'Indian Patents Act & BDA 2023',
    HI: 'भारतीय पेटेंट अधिनियम एवं BDA 2023',
    MR: 'भारतीय पेटंट कायदा आणि BDA 2023',
    SA: 'भारतीयपटण्टअधिनियमं च BDA २०२३ च',
  },
  jurisdiction_wipo_full: {
    EN: 'WIPO International / PCT Regime',
    HI: 'WIPO अंतर्राष्ट्रीय / PCT व्यवस्था',
    MR: 'WIPO आंतरराष्ट्रीय / PCT व्यवस्था',
    SA: 'WIPO आंतरराष्ट्रीयम् / PCT व्यवस्था',
  },
  read_aloud_btn: {
    EN: 'Read Aloud',
    HI: 'ज़ोर से पढ़ें',
    MR: 'मोठ्याने वाचा',
    SA: 'उच्चस्वरेण पठतु',
  },
  reading_btn: {
    EN: 'Reading...',
    HI: 'पढ़ा जा रहा है...',
    MR: 'वाचत आहे...',
    SA: 'पठ्यते...',
  },
  confidence_label: {
    EN: 'Confidence:',
    HI: 'विश्वसनीयता:',
    MR: 'विश्वासार्हता:',
    SA: 'प्रामाणिकता',
  },
  audit_label: {
    EN: 'Audit:',
    HI: 'लेखापरीक्षण:',
    MR: 'लेखापरीक्षण:',
    SA: 'लेखापरीक्षणम्',
  },
  botanicals_label: {
    EN: 'Resolved Botanical Species & Pharmacopoeial Standards',
    HI: 'समाधानित वनस्पति प्रजातियाँ और फार्माकोपियल मानक',
    MR: 'निराकरण केलेल्या वनस्पती प्रजाती आणि फार्माकोपियल मानक',
    SA: 'सम्यग्गृहीतानि वनस्पतिजातीनि फार्माकोपियमानानि च',
  },
  precedent_label: {
    EN: 'Biopiracy Landmark Precedent:',
    HI: 'जैवचोरी मील का पत्थर पूर्ण नज़ीर:',
    MR: 'जैवचोरी महत्त्वाचा न्यायालयीन पूर्वादर्श:',
    SA: 'जैवचौर्यमहत्वपूर्णपूर्वदृष्टान्तः',
  },
  examiner_label: {
    EN: 'Simulated Patent Examiner Rejection (Adversarial Check)',
    HI: 'अनुकरणीय पेटेंट परीक्षक अस्वीकृति (प्रतिकूल जाँच)',
    MR: 'अनुकरणीय पेटंट परीक्षक नकार (विरोधी तपासणी)',
    SA: 'अनुकरणीयपटण्टपरीक्षकानिराकरणं (प्रतिपक्षीयपरीक्षा)',
  },
  examiner_show_btn: {
    EN: 'View Rejection Stance',
    HI: 'अस्वीकृति दृष्टिकोण देखें',
    MR: 'नकार भूमिका पहा',
    SA: 'निराकरणदृष्टिकोणं पश्यतु',
  },
  examiner_hide_btn: {
    EN: 'Hide',
    HI: 'छुपाएँ',
    MR: 'लपवा',
    SA: 'अन्तर्धीयताम्',
  },
  reasoning_section_title: {
    EN: 'Statutory Reasoning & Legal Analysis',
    HI: 'वैधानिक तर्क एवं विधिक विश्लेषण',
    MR: 'वैधानिक तर्क आणि कायदेशीर विश्लेषण',
    SA: 'वैधानिकहेतुपरम्परा विधिकविश्लेषणं च',
  },
  view_citation_btn: {
    EN: 'View Original Citation',
    HI: 'मूल उद्धरण देखें',
    MR: 'मूळ संदर्भ पहा',
    SA: 'मूलउद्धरणं पश्यतु',
  },
  nli_verified_label: {
    EN: 'NLI Verified',
    HI: 'NLI सत्यापित',
    MR: 'NLI सत्यापित',
    SA: 'NLI सत्यापितम्',
  },
  // ─── Viable Routes ───────────────────────────────────────────────────────────
  routes_section_title: {
    EN: 'Recommended Viable Protection Routes',
    HI: 'अनुशंसित व्यवहार्य संरक्षण मार्ग',
    MR: 'शिफारस केलेले व्यवहार्य संरक्षण मार्ग',
    SA: 'उपदिष्टाः व्यवहार्याः संरक्षणमार्गाः',
  },
  actionable_steps_label: {
    EN: 'Actionable Steps',
    HI: 'क्रियाशील कदम',
    MR: 'कृतीयोग्य पावले',
    SA: 'कार्यान्वयनसोपानानि',
  },
  escalate_facilitator_btn: {
    EN: 'Escalate to Facilitator',
    HI: 'सुविधाकर्ता को अग्रेषित करें',
    MR: 'सुलभकर्त्याकडे पाठवा',
    SA: 'सुलभकर्तृप्रति प्रेषयतु',
  },
  // ─── Jurisdiction Diff ───────────────────────────────────────────────────────
  diff_engine_title: {
    EN: 'Jurisdiction Diff Engine (India vs US vs EPO)',
    HI: 'न्यायाधिकार तुलना इंजन (भारत बनाम US बनाम EPO)',
    MR: 'न्यायक्षेत्र तुलना इंजन (भारत विरुद्ध US विरुद्ध EPO)',
    SA: 'न्यायाधिकारतुलनायन्त्रम् (भारतम् विरुद्धम् US विरुद्धम् EPO)',
  },
  diff_india_label: {
    EN: '🇮🇳 India (Patents Act + BDA)',
    HI: '🇮🇳 भारत (पेटेंट अधिनियम + BDA)',
    MR: '🇮🇳 भारत (पेटंट कायदा + BDA)',
    SA: '🇮🇳 भारतम् (पटण्टअधिनियमः + BDA)',
  },
  diff_us_label: {
    EN: '🇺🇸 USPTO',
    HI: '🇺🇸 USPTO',
    MR: '🇺🇸 USPTO',
    SA: '🇺🇸 USPTO',
  },
  diff_epo_label: {
    EN: '🇪🇺 EPO (Europe)',
    HI: '🇪🇺 EPO (यूरोप)',
    MR: '🇪🇺 EPO (युरोप)',
    SA: '🇪🇺 EPO (यूरोपः)',
  },
  diff_india_point1: {
    EN: 'NBA Form III Approval: Required',
    HI: 'NBA फॉर्म III अनुमोदन: आवश्यक',
    MR: 'NBA फॉर्म III मान्यता: आवश्यक',
    SA: 'NBA फॉर्म III अनुमोदनम्: आवश्यकम्',
  },
  diff_india_point2: {
    EN: 'Section 3(p) TK Bar Applies',
    HI: 'धारा 3(p) TK बाधा लागू',
    MR: 'कलम 3(p) TK बंदी लागू',
    SA: 'धारा ३(p) TK बाधः प्रवर्तते',
  },
  diff_us_point1: {
    EN: '102/103 Prior Art Rejections via AFI/TKDL',
    HI: '102/103 AFI/TKDL के माध्यम से पूर्व कला अस्वीकृति',
    MR: '102/103 AFI/TKDL द्वारे पूर्वकला नकार',
    SA: '१०२/१०३ AFI/TKDL द्वारा पूर्वकलावर्जनम्',
  },
  diff_us_point2: {
    EN: 'Process claims patentable if novel',
    HI: 'नवीन होने पर प्रक्रिया दावे पेटेंटयोग्य',
    MR: 'नाविन्यपूर्ण असल्यास प्रक्रिया दावे पेटंटयोग्य',
    SA: 'अभिनवत्वे प्रक्रियादावाः पेटण्टयोग्याः',
  },
  diff_epo_point1: {
    EN: 'Article 56 EPC Inventive Step Burden',
    HI: 'अनुच्छेद 56 EPC आविष्कार चरण बोझ',
    MR: 'अनुच्छेद 56 EPC शोध पाऊल ओझे',
    SA: 'अनुच्छेद ५६ EPC आविष्कारपदभारः',
  },
  diff_epo_point2: {
    EN: 'Nagoya Protocol origin disclosure',
    HI: 'नागोया प्रोटोकॉल मूल प्रकटीकरण',
    MR: 'नागोया प्रोटोकॉल मूळ प्रकटीकरण',
    SA: 'नागोयाप्रोटोकॉलमूलप्रकटनम्',
  },
  // ─── Abstention View ─────────────────────────────────────────────────────────
  abstention_title: {
    EN: 'Safe Abstention: Query Outside IP Scope',
    HI: 'सुरक्षित विरत: प्रश्न IP क्षेत्र से बाहर',
    MR: 'सुरक्षित विरत: प्रश्न IP क्षेत्राबाहेर',
    SA: 'सुरक्षितविरतिः: प्रश्नः IP क्षेत्रात् बहिः',
  },
  abstention_guardrail_label: {
    EN: 'SYSTEM MEDICAL GUARDRAIL TRIGGERED',
    HI: 'प्रणाली चिकित्सा सुरक्षा-रेखा सक्रिय',
    MR: 'सिस्टम वैद्यकीय सुरक्षा-रेषा सक्रिय',
    SA: 'प्रणालीचिकित्सासुरक्षारेखा सक्रिया जाता',
  },
  abstention_query_label: {
    EN: 'Query:',
    HI: 'प्रश्न:',
    MR: 'प्रश्न:',
    SA: 'प्रश्नः',
  },
  escalation_routing_title: {
    EN: 'Escalation & Expert Routing',
    HI: 'अग्रेषण एवं विशेषज्ञ रूटिंग',
    MR: 'अग्रेषण आणि तज्ज्ञ रूटिंग',
    SA: 'प्रेषणं विशेषज्ञमार्गदर्शनं च',
  },
  escalation_generate_btn: {
    EN: 'Generate Escalation Brief',
    HI: 'अग्रेषण संक्षेप तैयार करें',
    MR: 'अग्रेषण सारांश तयार करा',
    SA: 'प्रेषणसंक्षेपं रचयतु',
  },
  escalation_notice: {
    EN: 'For therapeutic dosages, clinical questions, or formal patent prosecution, please consult licensed medical authorities or registered patent facilitators:',
    HI: 'चिकित्सीय खुराक, नैदानिक प्रश्नों, या औपचारिक पेटेंट अभियोजन के लिए कृपया लाइसेंस प्राप्त चिकित्सा प्राधिकरण या पंजीकृत पेटेंट सुविधाकर्ताओं से परामर्श करें:',
    MR: 'उपचारात्मक डोस, नैदानिक प्रश्न, किंवा अधिकृत पेटंट अभियोजनासाठी कृपया परवानाधारक वैद्यकीय अधिकारी किंवा नोंदणीकृत पेटंट सुलभकर्त्यांशी संपर्क करा:',
    SA: 'चिकित्सीयमात्राणां, नैदानिकप्रश्नानां, औपचारिकपटण्टअभियोजनाय वा अनुज्ञाप्राप्तचिकित्साप्राधिकरणं पञ्जीकृतपटण्टसुलभकर्तृणां वा परामर्शं गृह्णीयात्:',
  },
  escalation_link_ipo: {
    EN: 'IP India Registered Patent Agents Registry',
    HI: 'IP India पंजीकृत पेटेंट एजेंट रजिस्ट्री',
    MR: 'IP India नोंदणीकृत पेटंट एजंट नोंदवही',
    SA: 'IP India पञ्जीकृतपटण्टप्रतिनिधिसूची',
  },
  escalation_link_ayush: {
    EN: 'Ministry of Ayush Portal',
    HI: 'आयुष मंत्रालय पोर्टल',
    MR: 'आयुष मंत्रालय पोर्टल',
    SA: 'आयुष मन्त्रालयः पोर्टलम्',
  },
  audit_trail_label: {
    EN: 'Cryptographic Audit Trail',
    HI: 'क्रिप्टोग्राफिक लेखापरीक्षण पगडंडी',
    MR: 'क्रिप्टोग्राफिक लेखापरीक्षण मार्ग',
    SA: 'गूढलेखनलेखापरीक्षणपथः',
  },
  dpdp_compliant_label: {
    EN: 'DPDP-2023 COMPLIANT',
    HI: 'DPDP-2023 अनुपालित',
    MR: 'DPDP-2023 अनुपालित',
    SA: 'DPDP-2023 अनुपालितम्',
  },
  txn_id_label: {
    EN: 'Transaction ID:',
    HI: 'लेनदेन आईडी:',
    MR: 'व्यवहार आयडी:',
    SA: 'व्यवहारसङ्ख्या:',
  },
  timestamp_label: {
    EN: 'Timestamp:',
    HI: 'टाइमस्टैम्प:',
    MR: 'वेळमुद्रांक:',
    SA: 'कालमुद्रा:',
  },
  hash_label: {
    EN: 'Hash:',
    HI: 'हैश:',
    MR: 'हॅश:',
    SA: 'हैश:',
  },
  // ─── Citation Vault Modal ────────────────────────────────────────────────────
  citation_vault_title: {
    EN: 'Statutory Citation Vault',
    HI: 'वैधानिक उद्धरण भंडार',
    MR: 'वैधानिक संदर्भ भांडार',
    SA: 'वैधानिकउद्धरणकोषः',
  },
  statutory_source_label: {
    EN: 'Statutory Source Authority',
    HI: 'वैधानिक स्रोत प्राधिकरण',
    MR: 'वैधानिक स्रोत प्राधिकरण',
    SA: 'वैधानिकस्रोतप्राधिकरणम्',
  },
  legislation_version_label: {
    EN: 'Legislation Version:',
    HI: 'विधान संस्करण:',
    MR: 'कायदेशीर आवृत्ती:',
    SA: 'विधानसंस्करणम्:',
  },
  sha_hash_label: {
    EN: '✓ SHA-256 Hash:',
    HI: '✓ SHA-256 हैश:',
    MR: '✓ SHA-256 हॅश:',
    SA: '✓ SHA-256 हैश:',
  },
  india_code_link: {
    EN: 'India Code Official Registry',
    HI: 'इंडिया कोड आधिकारिक रजिस्ट्री',
    MR: 'इंडिया कोड अधिकृत नोंदवही',
    SA: 'इंडिया कोड आधिकारिकनोंदवही',
  },
  statutory_meaning_label: {
    EN: 'Statutory Meaning:',
    HI: 'वैधानिक अर्थ:',
    MR: 'वैधानिक अर्थ:',
    SA: 'वैधानिकार्थः:',
  },
  // ─── Floating / Footer ──────────────────────────────────────────────────────
  ask_assistant_btn: {
    EN: 'Ask Assistant',
    HI: 'सहायक से पूछें',
    MR: 'सहाय्यकाला विचारा',
    SA: 'सहायकं पृच्छतु',
  },
  footer_text: {
    EN: 'IP-SAKTI Sahayak · Smart India Hackathon 2026 (SIH26045) · Ministry of Ayush Target',
    HI: 'IP-SAKTI सहायक · स्मार्ट इंडिया हैकथॉन 2026 (SIH26045) · आयुष मंत्रालय',
    MR: 'IP-SAKTI सहाय्यक · स्मार्ट इंडिया हॅकथॉन 2026 (SIH26045) · आयुष मंत्रालय',
    SA: 'IP-SAKTI सहायकः · स्मार्ट इण्डिया हैकथॉन 2026 (SIH26045) · आयुष मन्त्रालयः',
  },
  legal_notice_label: {
    EN: 'Legal Notice:',
    HI: 'कानूनी सूचना:',
    MR: 'कायदेशीर सूचना:',
    SA: 'विधिकसूचना:',
  },
  legal_notice_text: {
    EN: 'Statutory Intelligence, Not Legal Advice. Traceable to public Indian & International IP acts. Consult a registered Patent Agent for formal filing.',
    HI: 'वैधानिक बुद्धिमत्ता, कानूनी सलाह नहीं। सार्वजनिक भारतीय और अंतर्राष्ट्रीय IP अधिनियमों पर आधारित। औपचारिक दाखिल के लिए पंजीकृत पेटेंट एजेंट से परामर्श करें।',
    MR: 'वैधानिक बुद्धिमत्ता, कायदेशीर सल्ला नाही। सार्वजनिक भारतीय आणि आंतरराष्ट्रीय IP कायद्यांवर आधारित. अधिकृत दाखल्यासाठी नोंदणीकृत पेटंट एजंटशी संपर्क करा.',
    SA: 'वैधानिकमेधा, न विधिकपरामर्शः। सार्वजनिकभारतीयआन्तरराष्ट्रीय IP अधिनियमेषु प्रतिष्ठितम्। औपचारिकदाखिलाय पञ्जीकृतपटण्टप्रतिनिधिं परामर्शयतु।',
  },
  dpdp_tag: {
    EN: 'DPDP Act 2023 Compliant · Non-PII Session',
    HI: 'DPDP अधिनियम 2023 अनुपालित · गैर-PII सत्र',
    MR: 'DPDP कायदा 2023 अनुपालित · गैर-PII सत्र',
    SA: 'DPDP अधिनियम 2023 अनुपालितम् · गैर-PII सत्रम्',
  },
  // ─── Severity Badges ─────────────────────────────────────────────────────────
  severity_barred: {
    EN: 'BARRED',
    HI: 'वर्जित',
    MR: 'प्रतिबंधित',
    SA: 'निषिद्धम्',
  },
  severity_approval_required: {
    EN: 'APPROVAL REQUIRED',
    HI: 'अनुमोदन आवश्यक',
    MR: 'मान्यता आवश्यक',
    SA: 'अनुमोदनमावश्यकम्',
  },
  severity_disclosure_mandate: {
    EN: 'DISCLOSURE MANDATE',
    HI: 'प्रकटीकरण अनिवार्य',
    MR: 'प्रकटीकरण अनिवार्य',
    SA: 'प्रकटनमनिवार्यम्',
  },
  severity_conditionally_viable: {
    EN: 'CONDITIONALLY VIABLE',
    HI: 'सशर्त व्यवहार्य',
    MR: 'सशर्त व्यवहार्य',
    SA: 'सशर्तव्यवहार्यम्',
  },
  // ─── App Header ──────────────────────────────────────────────────────────────
  statutory_rag_label: {
    EN: 'STATUTORY RAG ENGINE',
    HI: 'वैधानिक RAG इंजन',
    MR: 'वैधानिक RAG इंजन',
    SA: 'वैधानिक RAG यन्त्रम्',
  },
  ministry_badge: {
    EN: 'Ministry of Ayush · SIH26045',
    HI: 'आयुष मंत्रालय · SIH26045',
    MR: 'आयुष मंत्रालय · SIH26045',
    SA: 'आयुष मन्त्रालयः · SIH26045',
  },
  // ─── Hardcoded brain step titles ─────────────────────────────────────────────
  step_3p_title: {
    EN: 'Section 3(p) — Traditional Knowledge / aggregation bar (PRODUCT CLAIM BARRED)',
    HI: 'धारा 3(p) — पारंपरिक ज्ञान / संचय बाधा (उत्पाद दावा वर्जित)',
    MR: 'कलम 3(p) — पारंपरिक ज्ञान / संचय बंदी (उत्पाद दावा प्रतिबंधित)',
    SA: 'धारा ३(p) — पारम्परिकज्ञानं / सञ्चयबाधः (उत्पाददावा वर्जितः)',
  },
  step_3e_title: {
    EN: 'Section 3(e) — Mere admixture / aggregation of properties (SYNERGY PROOF REQUIRED)',
    HI: 'धारा 3(e) — केवल मिश्रण / गुणों का संचय (तालमेल प्रमाण आवश्यक)',
    MR: 'कलम 3(e) — केवळ मिश्रण / गुणधर्मांचे संचय (सहकार्य पुरावा आवश्यक)',
    SA: 'धारा ३(e) — केवलमिश्रणं / गुणानां सञ्चयः (सहकार्यप्रमाणम् आवश्यकम्)',
  },
  step_3d_process_title: {
    EN: 'Section 3(d) — Novel process route CONDITIONALLY VIABLE (efficacy data required)',
    HI: 'धारा 3(d) — नवीन प्रक्रिया मार्ग सशर्त व्यवहार्य (प्रभावकारिता डेटा आवश्यक)',
    MR: 'कलम 3(d) — नाविन्यपूर्ण प्रक्रिया मार्ग सशर्त व्यवहार्य (परिणामकारकता डेटा आवश्यक)',
    SA: 'धारा ३(d) — अभिनवप्रक्रियामार्गः सशर्तव्यवहार्यः (प्रभावकारितादत्तांशः आवश्यकः)',
  },
  step_3d_title: {
    EN: 'Section 3(d) — Enhanced-efficacy burden for derivatives / new uses',
    HI: 'धारा 3(d) — व्युत्पन्न / नए उपयोगों के लिए वर्धित प्रभावकारिता बोझ',
    MR: 'कलम 3(d) — व्युत्पन्न / नवीन वापरांसाठी वर्धित परिणामकारकता ओझे',
    SA: 'धारा ३(d) — व्युत्पन्नानां / नूतनोपयोगानां कृते वर्धितप्रभावकारिताभारः',
  },
  step_bda6_title: {
    EN: 'BDA Section 6(1) — Prior NBA approval MANDATORY before any IPR filing',
    HI: 'BDA धारा 6(1) — किसी भी IPR दाखिल से पहले NBA पूर्व अनुमोदन अनिवार्य',
    MR: 'BDA कलम 6(1) — कोणत्याही IPR दाखल करण्यापूर्वी NBA पूर्व मान्यता अनिवार्य',
    SA: 'BDA धारा ६(१) — कस्मादपि IPR दाखिलात् पूर्वं NBA पूर्वानुमोदनम् अनिवार्यम्',
  },
  step_bda7_title: {
    EN: 'BDA Section 7 — Prior intimation to State Biodiversity Board (commercial use)',
    HI: 'BDA धारा 7 — राज्य जैव विविधता बोर्ड को पूर्व सूचना (व्यावसायिक उपयोग)',
    MR: 'BDA कलम 7 — राज्य जैवविविधता मंडळास पूर्व सूचना (व्यावसायिक वापर)',
    SA: 'BDA धारा ७ — राज्यजैवविविधतामण्डलाय पूर्वसूचना (व्यावसायिकोपयोगः)',
  },
  step_bda3_title: {
    EN: 'BDA Section 3 — Foreign-entity access requires prior NBA approval (Form I)',
    HI: 'BDA धारा 3 — विदेशी संस्था की पहुंच के लिए NBA पूर्व अनुमोदन आवश्यक (फॉर्म I)',
    MR: 'BDA कलम 3 — परकीय संस्थेच्या प्रवेशासाठी NBA पूर्व मान्यता आवश्यक (फॉर्म I)',
    SA: 'BDA धारा ३ — विदेशीसंस्थाप्रवेशाय NBA पूर्वानुमोदनम् आवश्यकम् (प्रपत्रम् I)',
  },
  step_s10_title: {
    EN: 'Patents Act s.10(4)(d) — Disclose source & geographical origin of bio-material',
    HI: 'पेटेंट अधिनियम धारा 10(4)(d) — जैव-सामग्री का स्रोत और भौगोलिक उद्गम प्रकट करें',
    MR: 'पेटंट कायदा कलम 10(4)(d) — जैव-सामग्रीचा स्रोत आणि भौगोलिक उत्पत्ती प्रकट करा',
    SA: 'पेटण्ट् अधिनियम धारा १०(४)(d) — जैवसामग्र्याः स्रोतः भौगोलिकमूलं च प्रकटयतु',
  },
  step_gratk3_title: {
    EN: 'WIPO GRATK Art.3 — MANDATORY disclosure of GR origin + associated TK (PCT track)',
    HI: 'WIPO GRATK अनुच्छेद 3 — GR उद्गम + संबद्ध TK का अनिवार्य प्रकटीकरण (PCT ट्रैक)',
    MR: 'WIPO GRATK अनु. 3 — GR उत्पत्ती + संबंधित TK चे अनिवार्य प्रकटीकरण (PCT मार्ग)',
    SA: 'WIPO GRATK अनु. ३ — GR मूलस्य + सम्बद्धस्य TK इत्यस्य अनिवार्यप्रकटनम् (PCT मार्गः)',
  },
  step_gratk4_title: {
    EN: 'WIPO GRATK Art.4 — TKDL/AFI counts as searchable prior art internationally',
    HI: 'WIPO GRATK अनुच्छेद 4 — TKDL/AFI अंतर्राष्ट्रीय स्तर पर खोज योग्य पूर्व कला मानी जाती है',
    MR: 'WIPO GRATK अनु. 4 — TKDL/AFI आंतरराष्ट्रीय स्तरावर शोधण्यायोग्य पूर्वकला मानली जाते',
    SA: 'WIPO GRATK अनु. ४ — TKDL/AFI अन्ताराष्ट्रियस्तरे अन्वेषणयोग्या पूर्वकला मन्यते',
  },
  step_3p_generic_title: {
    EN: 'Section 3(p) — Claimed herbal formulation is TK aggregation (PRODUCT CLAIM BARRED)',
    HI: 'धारा 3(p) — दावा की गई हर्बल सूत्रता TK संचय है (उत्पाद दावा वर्जित)',
    MR: 'कलम 3(p) — दावा केलेले हर्बल सूत्र TK संचय आहे (उत्पाद दावा प्रतिबंधित)',
    SA: 'धारा ३(p) — दावाकृतं वनौषधिसूत्रं TK सञ्चयः अस्ति (उत्पाददावा वर्जितः)',
  },
  step_3e_generic_title: {
    EN: 'Section 3(e) — Mere admixture bar applies (SYNERGY PROOF REQUIRED)',
    HI: 'धारा 3(e) — केवल मिश्रण बाधा लागू (तालमेल प्रमाण आवश्यक)',
    MR: 'कलम 3(e) — केवळ मिश्रण बंदी लागू (सहकार्य पुरावा आवश्यक)',
    SA: 'धारा ३(e) — केवलमिश्रणबाधः प्रवर्तते (सहकार्यप्रमाणम् आवश्यकम्)',
  },
  // ─── Legal Disclaimer Banner ─────────────────────────────────────────────────
  legal_notice_bold: {
    EN: 'Legal Notice:',
    HI: 'कानूनी सूचना:',
    MR: 'कायदेशीर सूचना:',
    SA: 'विधिकसूचना:',
  },
  dpdp_non_pii: {
    EN: 'DPDP Act 2023 Compliant · Non-PII Session',
    HI: 'DPDP अधिनियम 2023 अनुपालित · गैर-PII सत्र',
    MR: 'DPDP कायदा 2023 अनुपालित · गैर-PII सत्र',
    SA: 'DPDP अधिनियम 2023 अनुपालितम् · गैर-PII सत्रम्',
  },
  footer_zero_retention: {
    EN: 'Zero-Retention Ephemeral Pipeline',
    HI: 'शून्य-अवधारण अल्पकालीन पाइपलाइन',
    MR: 'शून्य-धारण क्षणिक पाइपलाइन',
    SA: 'शून्यधारणक्षणिकपाइपलाइन',
  },
  footer_sha256: {
    EN: 'SHA-256 Audit Grounding',
    HI: 'SHA-256 लेखापरीक्षण आधार',
    MR: 'SHA-256 लेखापरीक्षण आधार',
    SA: 'SHA-256 लेखापरीक्षणाधारः',
  },
  // ─── Follow-Up Chat ───────────────────────────────────────────────────────────
  chat_title: {
    EN: 'Statutory AI Assistant',
    HI: 'वैधानिक AI सहायक',
    MR: 'वैधानिक AI सहाय्यक',
    SA: 'वैधानिक AI सहायकः',
  },
  chat_grounded_label: {
    EN: 'Grounded Context',
    HI: 'आधारित संदर्भ',
    MR: 'आधारित संदर्भ',
    SA: 'आधारितसंदर्भः',
  },
  chat_subtitle: {
    EN: 'Ask follow-up questions regarding statutory grounds, Section 3(p) prior art, or viable pivot routes.',
    HI: 'वैधानिक आधार, धारा 3(p) पूर्व कला, या व्यवहार्य वैकल्पिक मार्गों के बारे में अनुवर्ती प्रश्न पूछें।',
    MR: 'वैधानिक आधार, कलम 3(p) पूर्वकला, किंवा व्यवहार्य वैकल्पिक मार्गांबद्दल पुढील प्रश्न विचारा।',
    SA: 'वैधानिकाधार, धारा ३(p) पूर्वकला, व्यवहार्यविकल्पमार्गाणां च विषये अनुवर्तीप्रश्नान् पृच्छतु।',
  },
  chat_context_prefix: {
    EN: 'Context:',
    HI: 'संदर्भ:',
    MR: 'संदर्भ:',
    SA: 'संदर्भः:',
  },
  chat_welcome_title: {
    EN: 'How can I assist with this verdict?',
    HI: 'मैं इस निर्णय में कैसे सहायता कर सकता हूँ?',
    MR: 'मी या निकालात कशी मदत करू शकतो?',
    SA: 'अस्मिन् निर्णये अहं कथं सहायं कर्तुं शक्नोमि?',
  },
  chat_welcome_sub: {
    EN: 'I am grounded in the statutory analysis for',
    HI: 'मैं वैधानिक विश्लेषण पर आधारित हूँ:',
    MR: 'मी वैधानिक विश्लेषणावर आधारित आहे:',
    SA: 'अहं वैधानिकविश्लेषणे आधारितः अस्मि:',
  },
  chat_loading: {
    EN: 'Analyzing statutory provisions and case law citations...',
    HI: 'वैधानिक प्रावधान और केस कानून उद्धरणों का विश्लेषण हो रहा है...',
    MR: 'वैधानिक तरतुदी आणि केस कायदा संदर्भांचे विश्लेषण होत आहे...',
    SA: 'वैधानिकप्रावधानानां केसकानूनोद्धरणानां च विश्लेषणं वर्तते...',
  },
  chat_placeholder: {
    EN: "Ask a question on this analysis (e.g., 'What evidence proves synergy under Section 3(e)?')...",
    HI: 'इस विश्लेषण पर प्रश्न पूछें (जैसे "धारा 3(e) के तहत तालमेल सिद्ध करने के लिए क्या साक्ष्य चाहिए?")...',
    MR: 'या विश्लेषणावर प्रश्न विचारा (उदा. "कलम 3(e) अंतर्गत सहकार्य सिद्ध करण्यासाठी कोणते पुरावे हवेत?")...',
    SA: 'अस्मिन् विश्लेषणे प्रश्नं पृच्छतु (यथा "धारा ३(e) अन्तर्गत सहकार्यप्रमाणं किम्?")...',
  },
  chat_footer_hint: {
    EN: 'Press Enter ↵ to submit · Grounded in Public Patent Acts & TKDL',
    HI: 'सबमिट के लिए Enter ↵ दबाएँ · सार्वजनिक पेटेंट अधिनियम और TKDL पर आधारित',
    MR: 'सबमिट करण्यासाठी Enter ↵ दाबा · सार्वजनिक पेटंट कायदे आणि TKDL वर आधारित',
    SA: 'प्रेषणाय Enter ↵ पातयतु · सार्वजनिकपटण्टअधिनियमेषु TKDL च आधारितम्',
  },
  chat_citations_label: {
    EN: 'Statutory Citations:',
    HI: 'वैधानिक उद्धरण:',
    MR: 'वैधानिक संदर्भ:',
    SA: 'वैधानिकोद्धरणानि:',
  },
  chat_copy: {
    EN: 'Copy',
    HI: 'कॉपी करें',
    MR: 'कॉपी करा',
    SA: 'प्रतिलिप्यताम्',
  },
  chat_copied: {
    EN: 'Copied',
    HI: 'कॉपी हो गया',
    MR: 'कॉपी झाले',
    SA: 'प्रतिलिपितम्',
  },
  chat_clear: {
    EN: 'Clear',
    HI: 'साफ करें',
    MR: 'साफ करा',
    SA: 'शोध्यताम्',
  },
  // ─── Facilitator Escalation Modal ─────────────────────────────────────────────
  facilitator_modal_title: {
    EN: 'Human IP Facilitator Escalation',
    HI: 'मानव IP सुविधाकर्ता अग्रेषण',
    MR: 'मानव IP सुलभकर्ता अग्रेषण',
    SA: 'मानव IP सुलभकर्तृप्रेषणम्',
  },
  facilitator_modal_subtitle: {
    EN: 'Ministry of Ayush & Startup India IP Facilitation Protocol',
    HI: 'आयुष मंत्रालय और स्टार्टअप इंडिया IP सुविधा प्रोटोकॉल',
    MR: 'आयुष मंत्रालय आणि स्टार्टअप इंडिया IP सुविधा प्रोटोकॉल',
    SA: 'आयुष मन्त्रालयः स्टार्टअप इण्डिया च IP सुविधा प्रोटोकॉलम्',
  },
  facilitator_preprosecution_title: {
    EN: 'Pre-Prosecution Handoff:',
    HI: 'पूर्व-अभियोजन सौंपना:',
    MR: 'पूर्व-अभियोजन हस्तांतरण:',
    SA: 'पूर्वाभियोजनहस्तांतरणम्:',
  },
  facilitator_preprosecution_body: {
    EN: 'This tool compiles your formulation evaluation into an official Ayush IP Facilitation Dossier. You can take this directly to a registered Patent Agent or Ministry of Ayush Facilitator for formal representation.',
    HI: 'यह उपकरण आपके सूत्रण मूल्यांकन को एक आधिकारिक आयुष IP सुविधा डोज़ियर में संकलित करता है। आप इसे सीधे किसी पंजीकृत पेटेंट एजेंट या आयुष मंत्रालय के सुविधाकर्ता के पास औपचारिक प्रतिनिधित्व के लिए ले जा सकते हैं।',
    MR: 'हे साधन तुमच्या सूत्रण मूल्यांकनाला अधिकृत आयुष IP सुविधा डोजियरमध्ये संकलित करते. तुम्ही हे थेट नोंदणीकृत पेटंट एजंट किंवा आयुष मंत्रालयाच्या सुलभकर्त्याकडे औपचारिक प्रतिनिधित्वासाठी नेऊ शकता.',
    SA: 'इदं साधनं भवतः सूत्रणमूल्यांकनम् आधिकारिकआयुष IP सुविधाडोजियरे संकलयति। भवान् इदं सीधं पञ्जीकृतपटण्टप्रतिनिधिप्रति आयुष मन्त्रालयस्य सुलभकर्तृप्रति वा औपचारिकप्रतिनिधित्वाय नेतुं शक्नोति।',
  },
  facilitator_innovator_label: {
    EN: 'Innovator / Applicant Name (Optional)',
    HI: 'अन्वेषक / आवेदक का नाम (वैकल्पिक)',
    MR: 'संशोधक / अर्जदाराचे नाव (पर्यायी)',
    SA: 'अन्वेषकः / आवेदकस्य नाम (ऐच्छिकम्)',
  },
  facilitator_entity_label: {
    EN: 'Entity / Institution (Optional)',
    HI: 'संस्था / संगठन (वैकल्पिक)',
    MR: 'संस्था / संघटन (पर्यायी)',
    SA: 'संस्था / संगठनम् (ऐच्छिकम्)',
  },
  facilitator_dossier_id_label: {
    EN: 'Dossier Identifier:',
    HI: 'डोजियर पहचानकर्ता:',
    MR: 'डोजियर ओळखकर्ता:',
    SA: 'डोजियरपरिचायकः:',
  },
  facilitator_claim_label: {
    EN: 'Claim:',
    HI: 'दावा:',
    MR: 'दावा:',
    SA: 'दावः:',
  },
  facilitator_mandates_label: {
    EN: 'Key Mandates:',
    HI: 'मुख्य अनिवार्यताएँ:',
    MR: 'मुख्य अनिवार्यता:',
    SA: 'मुख्यानिवार्यताः:',
  },
  facilitator_checklist_title: {
    EN: 'Facilitator Immediate Checklist:',
    HI: 'सुविधाकर्ता तत्काल जाँचसूची:',
    MR: 'सुलभकर्ता तत्काल तपासणी सूची:',
    SA: 'सुलभकर्तृतत्कालसूचीः:',
  },
  facilitator_directories_title: {
    EN: 'Official Facilitation Directories:',
    HI: 'आधिकारिक सुविधा निर्देशिकाएँ:',
    MR: 'अधिकृत सुविधा निर्देशिका:',
    SA: 'आधिकारिकसुविधानिर्देशिकाः:',
  },
  facilitator_link_ip: {
    EN: 'IP India Registered Agents',
    HI: 'IP India पंजीकृत एजेंट',
    MR: 'IP India नोंदणीकृत एजंट',
    SA: 'IP India पञ्जीकृतप्रतिनिधयः',
  },
  facilitator_link_ayush: {
    EN: 'Ministry of Ayush Facilitation Cell',
    HI: 'आयुष मंत्रालय सुविधा सेल',
    MR: 'आयुष मंत्रालय सुविधा कक्ष',
    SA: 'आयुष मन्त्रालयसुविधाकक्षः',
  },
  facilitator_copy: {
    EN: 'Copy Brief',
    HI: 'संक्षेप कॉपी करें',
    MR: 'सारांश कॉपी करा',
    SA: 'संक्षेपं प्रतिलिप्यताम्',
  },
  facilitator_copied: {
    EN: 'Copied Brief',
    HI: 'संक्षेप कॉपी हो गया',
    MR: 'सारांश कॉपी झाला',
    SA: 'संक्षेपः प्रतिलिपितः',
  },
  facilitator_download: {
    EN: 'Download Case Dossier (.md)',
    HI: 'केस डोजियर डाउनलोड करें (.md)',
    MR: 'केस डोजियर डाउनलोड करा (.md)',
    SA: 'केसडोजियरम् डाउनलोडयतु (.md)',
  },
};

/**
 * Translate a key to the requested language.
 * Falls back to English if the key or language isn't found.
 */
export function t(key: TranslationKey, language: SupportedLanguage = 'EN'): string {
  return translations[key]?.[language] ?? translations[key]?.['EN'] ?? key;
}

/**
 * Translate a severity code to the requested language.
 */
export function severityLabel(severity: string, language: SupportedLanguage): string {
  switch (severity) {
    case 'BARRED':
      return t('severity_barred', language);
    case 'APPROVAL_REQUIRED':
      return t('severity_approval_required', language);
    case 'DISCLOSURE_MANDATE':
      return t('severity_disclosure_mandate', language);
    case 'CONDITIONALLY_VIABLE':
      return t('severity_conditionally_viable', language);
    default:
      return severity.replace(/_/g, ' ');
  }
}
