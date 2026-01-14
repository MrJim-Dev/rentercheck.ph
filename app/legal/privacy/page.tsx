import type { Metadata } from "next"
import { Navigation } from "@/components/landingpage/navigation"
import { Footer } from "@/components/landingpage/footer"

export const metadata: Metadata = {
    title: "Privacy Policy ",
    description: "Learn how RenterCheck collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navigation />
            
            <div className="container mx-auto px-4 py-16 mt-15 max-w-4xl">
                <div className="prose prose-invert max-w-none">
                    <h1 className="text-4xl font-bold mb-4">Privacy Policy — RenterCheck</h1>
                    
                    <div className="text-muted-foreground mb-8">
                        <p><strong>Effective Date:</strong> January 14, 2026</p>
                        <p><strong>Last Updated:</strong> January 14, 2026</p>
                    </div>

                    <p className="text-lg mb-8">
                        RenterCheck.ph ("RenterCheck", "we", "us") is a platform that allows users to submit rental-related incident reports and to check for potential matches using identifying information (such as name, phone number, or email). We are committed to protecting personal data and handling it responsibly.
                    </p>

                    <p className="text-lg mb-8">
                        This Privacy Policy explains what we collect, how we use it, how we protect it, and how you can contact us.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">1) Who We Are</h2>
                        <p className="mb-4">
                            RenterCheck.ph is operated by an individual based in the Philippines ("Operator").
                        </p>
                        <p className="mb-2">
                            <strong>Privacy Contact:</strong> <a href="mailto:privacy@rentercheck.ph" className="text-primary hover:underline">privacy@rentercheck.ph</a>
                        </p>
                        <p className="mb-4">
                            <strong>Support:</strong> <a href="mailto:support@rentercheck.ph" className="text-primary hover:underline">support@rentercheck.ph</a>
                        </p>
                        <p>
                            If you submit a valid privacy request or dispute, we may ask for information needed to verify your identity and evaluate the request.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">2) Scope</h2>
                        <p className="mb-2">This policy applies to:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Users who create an account and use the Service</li>
                            <li>Users who submit incident reports and upload evidence</li>
                            <li>Individuals who may be referenced in incident reports ("Reported Individuals")</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">3) Account Required</h2>
                        <p className="mb-2">To reduce abuse and protect platform integrity:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>An account is required to view search results</li>
                            <li>An account is required to submit incident reports</li>
                            <li>We may log certain usage and security events to prevent misuse (see Section 6).</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">4) Information We Collect</h2>
                        
                        <h3 className="text-xl font-semibold mb-3 mt-6">A) Information you provide</h3>
                        
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-2">Account information</h4>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Email address</li>
                                <li>Authentication credentials (handled through our authentication provider; we do not display your password)</li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-2">Search input</h4>
                            <ul className="list-disc pl-6 space-y-1">
                                <li>Data you enter to check (e.g., name, phone number, email address)</li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-2">Incident reports</h4>
                            <p className="mb-2">Reported person details that may include:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Full name</li>
                                <li>Phone number and/or email address</li>
                                <li>City (we only display city-level location in results)</li>
                            </ul>
                            
                            <p className="mb-2">Incident details:</p>
                            <ul className="list-disc pl-6 space-y-1 mb-4">
                                <li>Category (e.g., non-return of item, unpaid balance, damage dispute, etc.)</li>
                                <li>Date(s)</li>
                                <li>Optional amount involved</li>
                                <li>Short factual description</li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-2">Evidence uploads</h4>
                            <p className="mb-2">
                                Files you upload (e.g., screenshots, receipts, booking confirmations, messages, agreements)
                            </p>
                            <p className="text-yellow-500 font-medium">
                                Important: Do not upload unnecessary sensitive information (e.g., government ID numbers, full home addresses). If your proof contains sensitive information, redact it before uploading.
                            </p>
                        </div>

                        <h3 className="text-xl font-semibold mb-3 mt-6">B) Information we collect automatically</h3>
                        <p className="mb-2">When you use the Service, we may collect:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>IP address and approximate location derived from IP (for security/abuse prevention)</li>
                            <li>Device/browser information</li>
                            <li>Log data such as timestamps, pages accessed, and security events (e.g., rate-limiting triggers)</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">5) How We Use Your Information</h2>
                        <p className="mb-2">We use information to:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Provide matching and search results</li>
                            <li>Improve match accuracy and reduce duplicates</li>
                            <li>Accept, store, and review incident reports</li>
                            <li>Verify reports through admin review</li>
                            <li>Maintain platform security and prevent abuse (spam reports, scraping, harassment)</li>
                            <li>Communicate with you about support, disputes, or account-related notices</li>
                            <li>Comply with legal obligations and enforce our platform rules</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">6) Matching, Masking, and What Users Can See</h2>
                        <p className="mb-4">
                            We store raw phone numbers and emails to support matching and reduce duplicate reports. We do not display phone numbers or emails in search results.
                        </p>
                        <p className="mb-2">Search results may display limited information, such as:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>A masked name (example: "J*** O***")</li>
                            <li>Match indicator (example: "Phone match")</li>
                            <li>City only (not full address)</li>
                            <li>Report count and whether a report is verified (if applicable)</li>
                            <li>A general incident category (example: "Non-return of item")</li>
                            <li>Last activity date</li>
                        </ul>
                        <p>
                            We design results to avoid exposing sensitive identifiers while still allowing risk checking.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">7) Who Can Access Your Data</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Regular users can only see limited/masked result data based on their search inputs.</li>
                            <li>Only superadmins can access the full database records and uploaded evidence for verification, dispute handling, and enforcement.</li>
                            <li>We do not sell personal data.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">8) Sharing of Information</h2>
                        <p className="mb-2">We share data only when necessary:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>With service providers used to operate the platform (hosting, database, file storage)</li>
                            <li>To comply with law or respond to valid legal requests</li>
                            <li>To protect the rights, safety, and security of users and the platform (e.g., investigating abuse)</li>
                            <li>With your consent, if future features require it</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">9) Storage and Processing Location</h2>
                        <p>
                            We use Supabase for database and file storage. Our Supabase project is hosted in Singapore (SG). This means personal data may be stored and processed outside the Philippines depending on service provider infrastructure.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">10) Data Retention</h2>
                        <p className="mb-4">
                            We retain incident reports, matching identifiers, and related data for as long as necessary to support:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>fraud/risk prevention,</li>
                            <li>platform integrity,</li>
                            <li>verification and disputes,</li>
                            <li>and security/audit needs.</li>
                        </ul>
                        <p className="mb-2">
                            We may retain records for extended periods, and we may remove or restrict reports when:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>a report is successfully disputed,</li>
                            <li>the report is found to be inaccurate or unsupported,</li>
                            <li>or removal is required by law.</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">11) Security</h2>
                        <p className="mb-2">We use reasonable safeguards to protect information, such as:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Access controls (superadmin-only access to full records/evidence)</li>
                            <li>Authentication requirements for viewing/searching</li>
                            <li>HTTPS encryption in transit</li>
                            <li>Abuse detection and rate limiting</li>
                        </ul>
                        <p className="font-medium">
                            No system is perfectly secure. Please keep your account credentials confidential.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">12) Your Rights and How to Contact Us</h2>
                        <p className="mb-4">
                            If you believe you are incorrectly reported or you want to request correction/review, you may contact us.
                        </p>
                        <p className="mb-2 font-semibold">
                            Privacy Requests & Disputes: <a href="mailto:privacy@rentercheck.ph" className="text-primary hover:underline">privacy@rentercheck.ph</a>
                        </p>
                        <p className="mb-2">Include:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>what information you searched (e.g., phone/email you own, or other relevant details),</li>
                            <li>what result appeared,</li>
                            <li>why you believe it is incorrect,</li>
                            <li>and any supporting documents we may need to verify identity and resolve the dispute.</li>
                        </ul>
                        <p>
                            We may request reasonable proof to prevent unauthorized access or fraudulent takedown requests.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">13) Cookies and Analytics</h2>
                        <p>
                            We currently do not run analytics tools. We may use essential cookies or local storage for login sessions and security features. If we add analytics in the future, we will update this policy.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">14) Age Requirement</h2>
                        <p>
                            RenterCheck is intended for users 18 years old and above.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">15) Changes to This Policy</h2>
                        <p>
                            We may update this policy from time to time. We will update the "Last Updated" date and may provide additional notice for significant changes.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">16) Contact</h2>
                        <p className="mb-2">
                            <strong>Privacy:</strong> <a href="mailto:privacy@rentercheck.ph" className="text-primary hover:underline">privacy@rentercheck.ph</a>
                        </p>
                        <p>
                            <strong>Support:</strong> <a href="mailto:support@rentercheck.ph" className="text-primary hover:underline">support@rentercheck.ph</a>
                        </p>
                    </section>
                </div>
            </div>

            <Footer />
        </main>
    )
}
