import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function TermsOfService() {
    const isDark = true;

    return (
        <>
            <Head>
                <title>Terms of Service | Agent Arena</title>
                <meta name="description" content="Terms of Service for Agent Arena - Read our legal terms and conditions." />
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
                            Terms of Service
                        </h1>
                        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Last updated: April 16, 2026
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className={`prose max-w-none ${isDark ? 'prose-invert prose-headings:text-white prose-p:text-slate-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300' : 'prose-slate prose-headings:text-slate-900 prose-p:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-700'}`}>
                        <h2>1. Agreement to Terms</h2>
                        <p>
                            By accessing and using the Agent Arena website and services ("the Service"), you are agreeing to be bound by these Terms of Service. If you do not agree to abide by the above, please do not use this service.
                        </p>

                        <h2>2. Use License</h2>
                        <p>
                            Permission is granted to temporarily download one copy of the materials (information or software) on Agent Arena's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul>
                            <li>Modifying or copying the materials</li>
                            <li>Using the materials for any commercial purpose or for any public display</li>
                            <li>Attempting to decompile or reverse engineer any software contained on the website</li>
                            <li>Removing any copyright or other proprietary notations from the materials</li>
                            <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
                            <li>Violating any applicable laws or regulations</li>
                        </ul>

                        <h2>3. Disclaimer</h2>
                        <p>
                            The materials on Agent Arena's website are provided on an 'as is' basis. Agent Arena makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>

                        <h2>4. Limitations</h2>
                        <p>
                            In no event shall Agent Arena or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Agent Arena's website, even if Agent Arena or an authorized representative has been notified of the possibility of such damage.
                        </p>

                        <h2>5. Accuracy of Materials</h2>
                        <p>
                            The materials appearing on Agent Arena's website could include technical, typographical, or photographic errors. Agent Arena does not warrant that any of the materials on its website are accurate, complete, or current. Agent Arena may make changes to the materials contained on its website at any time without notice.
                        </p>

                        <h2>6. Links</h2>
                        <p>
                            Agent Arena has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Agent Arena of the site. Use of any such linked website is at the user's own risk.
                        </p>

                        <h2>7. Modifications</h2>
                        <p>
                            Agent Arena may revise these Terms of Service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these Terms of Service.
                        </p>

                        <h2>8. Governing Law</h2>
                        <p>
                            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Agent Arena operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
                        </p>

                        <h2>9. User-Generated Content</h2>
                        <p>
                            By submitting content to Agent Arena (including but not limited to comments, posts, or any other user-generated materials), you grant Agent Arena a non-exclusive, royalty-free, perpetual, and worldwide license to use, reproduce, modify, and distribute such content.
                        </p>

                        <h2>10. Intellectual Property Rights</h2>
                        <p>
                            All content on Agent Arena, including but not limited to text, graphics, logos, images, audio, and video, is the property of Agent Arena or its content suppliers and is protected by international copyright laws.
                        </p>

                        <h2>11. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms of Service, please contact us through our website's contact form or email address listed in the footer.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
