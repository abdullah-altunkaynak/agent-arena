import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function PrivacyPolicy() {
    const isDark = true;

    return (
        <>
            <Head>
                <title>Privacy Policy | Agent Arena</title>
                <meta name="description" content="Privacy Policy for Agent Arena - Learn how we protect and manage your personal data." />
                <meta name="robots" content="index, follow" />
            </Head>

            <Navbar />

            <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                {/* Header */}
                <div className={`${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'} border-b`}>
                    <div className="max-w-4xl mx-auto px-4 py-12">
                        <Link
                            href="/"
                            className={`inline-flex items-center gap-2 mb-6 transition-colors ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                            <ArrowLeft size={18} />
                            Back to Home
                        </Link>
                        <h1 className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            Privacy Policy
                        </h1>
                        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Last updated: April 16, 2026
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className={`prose max-w-none ${isDark ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300' : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700'}`}>
                        <h2>1. Introduction</h2>
                        <p>
                            Agent Arena ("we", "our", or "us") operates the Agent Arena website and related services. This Privacy Policy explains how we collect, use, disclose, and otherwise handle your information when you use our website and services.
                        </p>

                        <h2>2. Information We Collect</h2>
                        <p>
                            We may collect information about you in a variety of ways. The information we may collect on the site includes:
                        </p>
                        <ul>
                            <li><strong>Personal Information:</strong> Name, email address, password, and other account information when you register</li>
                            <li><strong>Blog Interaction Data:</strong> Comments, likes, and engagement with blog posts</li>
                            <li><strong>Chat and Agent Data:</strong> Content from AI agent interactions and chat logs</li>
                            <li><strong>Technical Information:</strong> IP address, browser type, pages visited, and other analytics data</li>
                            <li><strong>Community Data:</strong> Posts, comments, and other content you submit to community features</li>
                            <li><strong>Newsletter Subscription:</strong> Email address when you subscribe to our newsletter</li>
                        </ul>

                        <h2>3. How We Use Your Information</h2>
                        <p>
                            We use the information we collect in various ways, including to:
                        </p>
                        <ul>
                            <li>Create and maintain your account</li>
                            <li>Process transactions and send related information</li>
                            <li>Email you regarding your account or order</li>
                            <li>Improve our website and services</li>
                            <li>Monitor and analyze usage patterns and trends</li>
                            <li>Detect and prevent fraudulent transactions and other illegal activities</li>
                            <li>Personalize your experience and deliver content relevant to your interests</li>
                            <li>Send newsletters and marketing communications (with your consent)</li>
                            <li>Understand and improve AI model suggestions and recommendations</li>
                        </ul>

                        <h2>4. Protection of Your Information</h2>
                        <p>
                            Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems, and are required to keep the information confidential. Additionally, all sensitive/credit information you supply is encrypted via Secure Socket Layer (SSL) technology.
                        </p>

                        <h2>5. Third-Party Disclosure</h2>
                        <p>
                            We do not sell, trade, or otherwise transfer your personally identifiable information to third parties unless we provide you advance notice, except for the purpose of providing services you've requested. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or serving our users, as long as those parties agree to keep this information confidential.
                        </p>

                        <h2>6. Third-Party Links</h2>
                        <p>
                            Occasionally, at our discretion, we may include or offer third-party products or services on our website. These third-party sites have separate and independent privacy policies. We therefore have no responsibility or liability for the content and activities of these linked sites. Nonetheless, we seek to protect the integrity of our site and welcome any feedback about these sites.
                        </p>

                        <h2>7. Google Analytics</h2>
                        <p>
                            Agent Arena uses Google Analytics to track and analyze the usage of our website. Google Analytics collects information such as your IP address, browser type, and pages visited. This information helps us improve our website. You can opt-out of Google Analytics tracking by using available browser extensions.
                        </p>

                        <h2>8. GDPR Compliance</h2>
                        <p>
                            For users in the European Union, we comply with the General Data Protection Regulation (GDPR). You have the right to:
                        </p>
                        <ul>
                            <li>Access your personal data</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion of your data</li>
                            <li>Opt-out of data processing</li>
                            <li>Data portability</li>
                        </ul>
                        <p>
                            To exercise these rights, please contact us at the email address provided in the Contact Us section.
                        </p>

                        <h2>9. Data Retention</h2>
                        <p>
                            We retain your personal information for as long as your account is active or as long as needed to provide you services. You may request the deletion of your account and associated data at any time by contacting us.
                        </p>

                        <h2>10. Children's Privacy</h2>
                        <p>
                            Agent Arena is not directed to children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will delete such information from our systems immediately.
                        </p>

                        <h2>11. Changes to Our Privacy Policy</h2>
                        <p>
                            We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal, or regulatory reasons. We will notify users of any such changes by updating the "Last updated" date of this Privacy Policy.
                        </p>

                        <h2>12. Contact Us</h2>
                        <p>
                            If you have questions or concerns about our privacy practices, please contact us through our website's contact form or by reaching out to our support team. We are committed to resolving any privacy-related issues in a timely and professional manner.
                        </p>

                        <h2>13. Your Consent</h2>
                        <p>
                            By using our website, you consent to our privacy policy.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
