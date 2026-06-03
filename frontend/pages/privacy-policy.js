import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";

const POLICY_TR = [
    {
        title: "1. Giriş",
        body: "Bu Gizlilik Politikası, Agent Arena'yı kullandığınızda hangi verileri topladığımızı, nasıl işlediğimizi ve nasıl koruduğumuzu açıklar.",
    },
    {
        title: "2. Toplanan Veriler",
        body: "Hesap bilgileri, blog etkileşimleri, AI sohbet içerikleri, teknik kullanım verileri, topluluk paylaşımları ve bülten abonelik bilgileri toplanabilir.",
    },
    {
        title: "3. Verileri Kullanma Amaçları",
        body: "Hesap yönetimi, hizmet iyileştirme, güvenlik, analiz, kişiselleştirme, iletişim ve izin verdiğiniz pazarlama süreçleri için veriler işlenir.",
    },
    {
        title: "4. Veri Güvenliği",
        body: "Veriler, erişim kontrolleri ve güvenli ağ yapılarıyla korunur. Hassas bilgiler mümkün olan uygun yöntemlerle korunur.",
    },
    {
        title: "5. Üçüncü Taraf Paylaşımı",
        body: "Kişisel verileriniz, yasal zorunluluklar veya hizmet sağlayıcı operasyonları dışında üçüncü taraflara satılmaz ya da devredilmez.",
    },
    {
        title: "6. Üçüncü Taraf Bağlantılar",
        body: "Sitedeki üçüncü taraf bağlantılar kendi politikalarına tabidir. Bu sitelerin içerik ve uygulamalarından Agent Arena sorumlu değildir.",
    },
    {
        title: "7. Analitik",
        body: "Platform performansını geliştirmek için analitik araçları kullanılabilir. Bu araçlar trafik ve kullanım davranışları hakkında toplu bilgiler üretir.",
    },
    {
        title: "8. GDPR ve Haklarınız",
        body: "AB kullanıcıları için erişim, düzeltme, silme, işlemeyi kısıtlama ve veri taşınabilirliği hakları desteklenir.",
    },
    {
        title: "9. Veri Saklama",
        body: "Veriler, hizmet sağlama amacı sürdüğü sürece veya yasal gereklilikler doğrultusunda saklanır.",
    },
    {
        title: "10. Çocukların Gizliliği",
        body: "Agent Arena 13 yaş altı çocuklara yönelik değildir. Bu yaş grubundan veri toplandığı tespit edilirse veri silinir.",
    },
    {
        title: "11. Politika Güncellemeleri",
        body: "Gizlilik politikası operasyonel veya yasal nedenlerle güncellenebilir. Güncel sürüm tarihi sayfada belirtilir.",
    },
    {
        title: "12. İletişim",
        body: "Gizlilikle ilgili sorularınız için footer bölümündeki iletişim kanallarından bize ulaşabilirsiniz.",
    },
    {
        title: "13. Onay",
        body: "Platformu kullanarak bu gizlilik politikasını kabul etmiş olursunuz.",
    },
];

const POLICY_EN = [
    {
        title: "1. Introduction",
        body: "This Privacy Policy explains what data we collect, how we process it, and how we protect it when you use Agent Arena.",
    },
    {
        title: "2. Information We Collect",
        body: "We may collect account details, blog interactions, AI chat content, technical usage data, community submissions, and newsletter subscription data.",
    },
    {
        title: "3. How We Use Information",
        body: "Data is processed for account management, service improvement, security, analytics, personalization, communications, and consent-based marketing.",
    },
    {
        title: "4. Data Security",
        body: "We protect data using access controls and secure network practices. Sensitive information is protected with appropriate safeguards.",
    },
    {
        title: "5. Third-Party Disclosure",
        body: "Your personal data is not sold or transferred to third parties except where required for legal compliance or service operations.",
    },
    {
        title: "6. Third-Party Links",
        body: "External links are governed by their own privacy policies. Agent Arena is not responsible for those websites' content or practices.",
    },
    {
        title: "7. Analytics",
        body: "Analytics tools may be used to improve platform performance by generating aggregated traffic and behavior insights.",
    },
    {
        title: "8. GDPR and Your Rights",
        body: "For EU users, rights such as access, rectification, deletion, restriction, and data portability are supported.",
    },
    {
        title: "9. Data Retention",
        body: "Data is retained as long as necessary to provide services or satisfy legal requirements.",
    },
    {
        title: "10. Children's Privacy",
        body: "Agent Arena is not directed to children under 13. If such data is identified, it is removed.",
    },
    {
        title: "11. Policy Updates",
        body: "This policy may be updated for operational or legal reasons. The latest update date is shown on this page.",
    },
    {
        title: "12. Contact",
        body: "For privacy-related questions, please contact us via the channels listed in the footer.",
    },
    {
        title: "13. Consent",
        body: "By using the platform, you consent to this Privacy Policy.",
    },
];

export default function PrivacyPolicy() {
    const [language, setLanguage] = useState("tr");
    const isTurkish = language === "tr";
    const policy = isTurkish ? POLICY_TR : POLICY_EN;

    return (
        <>
            <Head>
                <title>{isTurkish ? "Gizlilik Politikası | Agent Arena" : "Privacy Policy | Agent Arena"}</title>
                <meta
                    name="description"
                    content={
                        isTurkish
                            ? "Agent Arena gizlilik politikası, veri toplama ve koruma süreçleri."
                            : "Agent Arena Privacy Policy for data collection and protection practices."
                    }
                />
                <meta name="robots" content="index, follow" />
            </Head>

            <Navbar />

            <div className="min-h-screen bg-slate-900 text-slate-200">
                <div className="border-b border-slate-700 bg-slate-800/40">
                    <div className="max-w-5xl mx-auto px-4 py-12">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-cyan-400 hover:text-cyan-300 transition-colors">
                            <ArrowLeft size={18} />
                            {isTurkish ? "Ana Sayfaya Dön" : "Back to Home"}
                        </Link>

                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-bold text-white">
                                    {isTurkish ? "Gizlilik Politikası" : "Privacy Policy"}
                                </h1>
                                <p className="mt-2 text-slate-400">{isTurkish ? "Son güncelleme: 3 Haziran 2026" : "Last updated: June 3, 2026"}</p>
                            </div>

                            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 p-1">
                                <button
                                    type="button"
                                    onClick={() => setLanguage("tr")}
                                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${isTurkish ? "bg-cyan-400/20 text-cyan-200" : "text-slate-400 hover:text-slate-200"
                                        }`}
                                >
                                    TR
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLanguage("en")}
                                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all ${!isTurkish ? "bg-cyan-400/20 text-cyan-200" : "text-slate-400 hover:text-slate-200"
                                        }`}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 py-12 grid gap-4">
                    {policy.map((item) => (
                        <section key={item.title} className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6">
                            <h2 className="text-xl font-semibold text-white mb-3">{item.title}</h2>
                            <p className="text-slate-300 leading-relaxed">{item.body}</p>
                        </section>
                    ))}
                </div>
            </div>
        </>
    );
}
