import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";

const TERMS_TR = [
    {
        title: "1. Şartların Kabulü",
        body: "Agent Arena web sitesi ve hizmetlerine erişerek bu Hizmet Şartları'nı kabul etmiş olursunuz. Şartları kabul etmiyorsanız lütfen hizmeti kullanmayın.",
    },
    {
        title: "2. Kullanım Lisansı",
        body: "Sitedeki materyalleri kişisel ve ticari olmayan geçici görüntüleme amacıyla kullanabilirsiniz. İçeriği kopyalama, ticari amaçla kullanma, tersine mühendislik yapma veya telif ibarelerini kaldırma yasaktır.",
    },
    {
        title: "3. Sorumluluk Reddi",
        body: "Sitedeki içerikler 'olduğu gibi' sunulur. Agent Arena, açık veya zımni hiçbir garanti vermez; belirli bir amaca uygunluk veya hak ihlali olmaması gibi garantiler dahil değildir.",
    },
    {
        title: "4. Sorumluluğun Sınırlandırılması",
        body: "Agent Arena, veri kaybı, kar kaybı veya iş kesintisi gibi dolaylı/doğrudan zararlardan sorumlu tutulamaz.",
    },
    {
        title: "5. İçerik Doğruluğu",
        body: "Sitedeki içeriklerde teknik veya yazımsal hatalar bulunabilir. Agent Arena içeriklerin tam, doğru veya güncel olduğunu garanti etmez.",
    },
    {
        title: "6. Harici Bağlantılar",
        body: "Siteden verilen üçüncü taraf bağlantıların içeriğinden Agent Arena sorumlu değildir. Bu bağlantıların kullanımı kullanıcı sorumluluğundadır.",
    },
    {
        title: "7. Değişiklikler",
        body: "Agent Arena bu şartları önceden bildirim yapmadan güncelleyebilir. Siteyi kullanmaya devam etmeniz yeni şartları kabul ettiğiniz anlamına gelir.",
    },
    {
        title: "8. Uygulanacak Hukuk",
        body: "Bu şartlar Agent Arena'nın faaliyet gösterdiği yargı alanı hukukuna tabidir ve ilgili mahkemelerin yetkisini kabul etmiş olursunuz.",
    },
    {
        title: "9. Kullanıcı İçeriği",
        body: "Siteye gönderdiğiniz içerikler için Agent Arena'ya dünya çapında, telifsiz ve münhasır olmayan kullanım, çoğaltma ve dağıtım lisansı verirsiniz.",
    },
    {
        title: "10. Fikri Mülkiyet",
        body: "Metin, görsel, logo, ses ve video dahil tüm içerikler Agent Arena veya içerik sağlayıcılarına aittir ve telif haklarıyla korunur.",
    },
    {
        title: "11. İletişim",
        body: "Hizmet şartları ile ilgili sorularınız için footer bölümünde yer alan e-posta üzerinden bizimle iletişime geçebilirsiniz.",
    },
];

const TERMS_EN = [
    {
        title: "1. Agreement to Terms",
        body: "By accessing Agent Arena and its services, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.",
    },
    {
        title: "2. Use License",
        body: "You may temporarily access site materials for personal, non-commercial viewing. Copying, commercial use, reverse engineering, or removing proprietary notices is prohibited.",
    },
    {
        title: "3. Disclaimer",
        body: "Materials are provided 'as is'. Agent Arena makes no express or implied warranties, including merchantability, fitness for a particular purpose, or non-infringement.",
    },
    {
        title: "4. Limitation of Liability",
        body: "Agent Arena shall not be liable for any indirect or direct damages, including data loss, profit loss, or business interruption.",
    },
    {
        title: "5. Accuracy of Materials",
        body: "Site content may include technical or typographical errors. Agent Arena does not warrant that materials are accurate, complete, or current.",
    },
    {
        title: "6. External Links",
        body: "Agent Arena is not responsible for third-party website content linked from this site. Use of external links is at your own risk.",
    },
    {
        title: "7. Revisions",
        body: "Agent Arena may revise these terms at any time without prior notice. Continued use of the site means you accept the updated terms.",
    },
    {
        title: "8. Governing Law",
        body: "These terms are governed by the laws of the jurisdiction where Agent Arena operates, and you submit to the jurisdiction of those courts.",
    },
    {
        title: "9. User-Generated Content",
        body: "By submitting content, you grant Agent Arena a worldwide, royalty-free, non-exclusive license to use, reproduce, and distribute such content.",
    },
    {
        title: "10. Intellectual Property",
        body: "All text, visuals, logos, audio, and video on Agent Arena are owned by Agent Arena or its suppliers and protected by copyright laws.",
    },
    {
        title: "11. Contact",
        body: "If you have questions regarding these terms, please contact us via the email address listed in the footer.",
    },
];

export default function TermsOfService() {
    const [language, setLanguage] = useState("tr");
    const isTurkish = language === "tr";
    const terms = isTurkish ? TERMS_TR : TERMS_EN;

    return (
        <>
            <Head>
                <title>{isTurkish ? "Kullanım Şartları | Agent Arena" : "Terms of Service | Agent Arena"}</title>
                <meta
                    name="description"
                    content={
                        isTurkish
                            ? "Agent Arena kullanım şartları, haklar, sorumluluklar ve yasal koşullar."
                            : "Agent Arena Terms of Service, rights, responsibilities, and legal conditions."
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
                                    {isTurkish ? "Kullanım Şartları" : "Terms of Service"}
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
                    {terms.map((item) => (
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
