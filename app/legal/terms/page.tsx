import type { Metadata } from "next"
import { Navigation } from "@/components/landingpage/navigation"
import { Footer } from "@/components/landingpage/footer"

export const metadata: Metadata = {
    title: "Terms of Use - RenterCheck.ph",
    description: "Read the Terms of Use for RenterCheck.ph, including acceptable use, reporting policies, and user responsibilities.",
}

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-background">
            <Navigation />
            
            <div className="container mx-auto px-4 py-16 mt-15 max-w-4xl">
                <div className="prose prose-invert max-w-none">
                    <h1 className="text-4xl font-bold mb-4">Terms of Use — RenterCheck.ph</h1>
                    
                    <div className="text-muted-foreground mb-8">
                        <p><strong>Effective Date:</strong> January 14, 2026</p>
                        <p><strong>Last Updated:</strong> January 14, 2026</p>
                    </div>

                    <p className="text-lg mb-8">
                        Welcome to RenterCheck.ph ("RenterCheck", "we", "us", "our"). By accessing or using our website, applications, and services (collectively, the "Service"), you agree to these Terms of Use ("Terms"). If you do not agree, do not use the Service.
                    </p>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">1) What RenterCheck Is (and Is Not)</h2>
                        <p className="mb-4">
                            RenterCheck helps users submit and check rental-related incident reports to support safer transactions.
                        </p>
                        <p className="font-medium">
                            RenterCheck is not a government agency, court, or law enforcement. We do not guarantee the truth, completeness, or accuracy of any report. The Service provides risk signals and a reporting/dispute workflow. You are responsible for your own decisions and due diligence.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">2) Eligibility (18+)</h2>
                        <p>
                            You must be at least 18 years old to use the Service. By using the Service, you represent that you meet this requirement.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">3) Accounts, Security, and Access</h2>
                        
                        <h3 className="text-xl font-semibold mb-3 mt-6">A) Account required</h3>
                        <p className="mb-2">An account is required to:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>View search results</li>
                            <li>Submit incident reports</li>
                            <li>Use dispute-related features (if applicable)</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3 mt-6">B) Account security</h3>
                        <p className="mb-2">You are responsible for:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Maintaining the confidentiality of your login credentials</li>
                            <li>All activity under your account</li>
                        </ul>
                        <p>Notify us immediately if you believe your account has been compromised.</p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">C) Account actions</h3>
                        <p>
                            We may suspend or terminate accounts that violate these Terms or create risk to users, the Service, or third parties.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">4) Acceptable Use (Strict Rules)</h2>
                        <p className="mb-2">You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Submit false, misleading, or fabricated reports</li>
                            <li>Harass, threaten, shame, or encourage others to harm anyone</li>
                            <li>Post or upload content that violates laws (including defamatory content) or third-party rights</li>
                            <li>Upload unnecessary sensitive data (e.g., government ID numbers, full home addresses) unless strictly needed for verification and redacted where possible</li>
                            <li>Attempt to scrape, crawl, or mass-collect data from the Service</li>
                            <li>Circumvent security, rate limits, or access controls</li>
                            <li>Use the Service to discriminate unlawfully or deny services in violation of applicable laws</li>
                            <li>Impersonate any person or entity</li>
                        </ul>
                        <p className="font-medium">
                            We may remove content, restrict access, or ban accounts for violations.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">5) How Search Results Work (Masked Outputs)</h2>
                        <p className="mb-2">To reduce exposure of sensitive information:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>We may display masked identifiers (e.g., partially masked names)</li>
                            <li>We do not display raw phone numbers or emails in search results</li>
                            <li>We may show limited details such as match indicators (e.g., "phone match"), city-level location, incident category, report count, verification status, and last activity date</li>
                        </ul>
                        <p>
                            Results depend on the information entered by the user and the matching method used. Name-only searches may be less accurate than phone/email matches.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">6) Credits and Payments (Search Credits Model)</h2>
                        <p className="mb-4">
                            RenterCheck may offer paid access through credits, where certain actions (such as searching) require credits.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">A) Credits are required per search</h3>
                        <p className="mb-4">
                            Each search attempt consumes credits as indicated in the Service (for example, 1 credit per search).
                        </p>
                        <p className="mb-4">
                            Credits may be consumed whether or not a match is found, including when results show "no match," "possible match," or "match found."
                        </p>
                        <p>
                            If you submit multiple searches, each attempt consumes credits separately.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">B) Earning credits through approved reports</h3>
                        <p className="mb-4">
                            RenterCheck may allow users to earn credits for contributing to platform safety:
                        </p>
                        <p className="mb-4">
                            If you submit an incident report and it is approved/verified by our superadmins, we may award credits to your account.
                        </p>
                        <p className="mb-4">
                            The number of credits awarded, eligibility rules, and limits (if any) are determined by RenterCheck and may change over time to prevent abuse.
                        </p>
                        <p>
                            Credits awarded for approved reports are also subject to these Terms and may be revoked if the report is later found to be false, misleading, or policy-violating.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">C) Credits are not money</h3>
                        <p className="mb-2">Credits:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Have no cash value</li>
                            <li>Are non-transferable and cannot be resold</li>
                            <li>Are not refundable, except where required by law or expressly stated otherwise</li>
                            <li>May expire only if we clearly state an expiry before you purchase or earn them (if no expiry is stated, you may use them until consumed)</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3 mt-6">D) Pricing and changes</h3>
                        <p>
                            We may change credit pricing, bundles, award amounts for approved reports, and credit requirements at any time. Changes do not affect credits already purchased, except where required for security, fraud prevention, or legal compliance.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">E) Failed searches / technical issues</h3>
                        <p>
                            If credits are consumed due to a confirmed technical error (for example, downtime or system malfunction), you may contact <a href="mailto:support@rentercheck.ph" className="text-primary hover:underline">support@rentercheck.ph</a> with details. At our discretion, we may restore credits after review.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">F) Chargebacks, fraud, and abuse</h3>
                        <p className="mb-2">
                            If we detect suspected fraud, abuse, or misuse of the credit system (including chargebacks or attempts to game the "earn credits" reporting process), we may:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Suspend or terminate your account</li>
                            <li>Remove or revoke credits (including earned credits)</li>
                            <li>Restrict access to credit-earning features</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3 mt-6">G) Taxes and fees</h3>
                        <p>
                            You are responsible for any taxes or fees applicable to your purchase, if any.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">7) User Content (Reports and Evidence)</h2>
                        <p className="mb-4">
                            "User Content" includes incident reports, text descriptions, and evidence files uploaded to the Service.
                        </p>
                        <p className="mb-2">By submitting User Content, you represent and warrant that:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>The report is based on your real experience or legitimate records</li>
                            <li>The information is truthful to the best of your knowledge</li>
                            <li>You have the right to upload the content and doing so does not violate any law or third-party rights</li>
                        </ul>
                        <p>
                            You grant RenterCheck a non-exclusive, worldwide, royalty-free license to host, store, display (in masked/limited form), and use User Content only as needed to operate, maintain, verify, and improve the Service, handle disputes, and enforce these Terms.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">8) Reporting Policy (Submitting an Incident)</h2>
                        <p className="mb-2">To submit a report, you must:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Provide identifying information sufficient for matching (at minimum: full name + phone or email, or other identifiers accepted by the Service)</li>
                            <li>Select an incident category (e.g., non-return, unpaid balance, damage dispute)</li>
                            <li>Provide a factual summary</li>
                            <li>Upload at least one proof/evidence file, unless the Service explicitly allows otherwise</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3 mt-6">A) Facts-only rule</h3>
                        <p>
                            Reports must be written in a factual and neutral manner. Avoid labels like "scammer" or "criminal." Focus on what happened and when.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">B) Evidence and redaction</h3>
                        <p>
                            Evidence should be relevant. Do not upload unnecessary sensitive data. If your evidence contains sensitive data, redact it before uploading (e.g., blur ID numbers and full addresses).
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">C) Verification status</h3>
                        <p className="mb-2">We may apply statuses such as:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Pending Review</li>
                            <li>Verified</li>
                            <li>Disputed</li>
                            <li>Resolved</li>
                            <li>Removed</li>
                        </ul>
                        <p>
                            Verification means the report met our internal review requirements (e.g., sufficient evidence), not that we guarantee guilt or legal wrongdoing.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">D) Duplicate and abusive reporting</h3>
                        <p className="mb-2">We may reject, merge, or remove:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Duplicate reports</li>
                            <li>Reports with insufficient evidence</li>
                            <li>Reports intended to harass or shame</li>
                            <li>Reports that appear fabricated or malicious</li>
                        </ul>
                        <p>
                            Repeated abuse may result in permanent suspension.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">9) Dispute Policy (Challenging a Report)</h2>
                        <p className="mb-4">
                            If you believe a report is inaccurate, misleading, or incorrectly identifies you, you may dispute it.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">A) How to dispute</h3>
                        <p className="mb-2">
                            Email <a href="mailto:privacy@rentercheck.ph" className="text-primary hover:underline">privacy@rentercheck.ph</a> with:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>The search information you used (e.g., phone/email you own) and what result appeared</li>
                            <li>Your dispute reason</li>
                            <li>Supporting proof to verify identity and evaluate the report</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3 mt-6">B) Identity verification</h3>
                        <p>
                            To prevent fraudulent takedown requests, we may request reasonable proof that you are the person linked to the identifiers used for matching.
                        </p>

                        <h3 className="text-xl font-semibold mb-3 mt-6">C) Review outcomes</h3>
                        <p className="mb-2">After review, we may:</p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Mark the report as Disputed</li>
                            <li>Request additional information from the reporter</li>
                            <li>Update/correct the report</li>
                            <li>Restrict visibility while investigating</li>
                            <li>Mark the report as Resolved</li>
                            <li>Remove the report if it is unsupported, inaccurate, or violates these Terms</li>
                        </ul>

                        <h3 className="text-xl font-semibold mb-3 mt-6">D) No guarantee of removal</h3>
                        <p>
                            We do not guarantee removal of reports. Removal depends on evidence, verification, and policy compliance.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">10) Moderation and Enforcement</h2>
                        <p className="mb-2">We may (but are not obligated to):</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Review any report or evidence</li>
                            <li>Remove or restrict access to content</li>
                            <li>Suspend or terminate accounts</li>
                            <li>Log and monitor usage to prevent abuse</li>
                            <li>Cooperate with lawful requests from authorities</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">11) Intellectual Property</h2>
                        <p>
                            The Service, including its software, design, and content (excluding User Content), is owned by RenterCheck or its licensors and is protected by applicable laws. You may not copy, modify, reverse engineer, or redistribute the Service without permission.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">12) Disclaimers</h2>
                        <p className="mb-2">
                            The Service is provided "AS IS" and "AS AVAILABLE." To the fullest extent permitted by law:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>We disclaim warranties of accuracy, fitness for a particular purpose, and non-infringement</li>
                            <li>We do not guarantee uninterrupted service or error-free operation</li>
                            <li>We do not guarantee the accuracy of any report or search result</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">13) Limitation of Liability</h2>
                        <p className="mb-2">
                            To the fullest extent allowed by law, RenterCheck and its Operator will not be liable for:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>Decisions you make based on the Service</li>
                            <li>Losses, damages, or disputes arising from User Content</li>
                            <li>Indirect, incidental, special, consequential, or punitive damages</li>
                            <li>Loss of profits, data, or reputation</li>
                        </ul>
                        <p>
                            If liability cannot be excluded, it will be limited to the amount you paid to use the Service in the past 30 days, to the extent permitted by law.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">14) Indemnity</h2>
                        <p className="mb-2">
                            You agree to defend, indemnify, and hold harmless RenterCheck and its Operator from claims, damages, liabilities, and expenses arising from:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Your use of the Service</li>
                            <li>Your submitted User Content</li>
                            <li>Your violation of these Terms or applicable law</li>
                        </ul>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">15) Termination</h2>
                        <p className="mb-2">
                            You may stop using the Service at any time. We may suspend or terminate access if:
                        </p>
                        <ul className="list-disc pl-6 mb-4 space-y-2">
                            <li>You violate these Terms</li>
                            <li>Your activity risks harm to users or the platform</li>
                            <li>Required by law or enforcement action</li>
                        </ul>
                        <p>
                            We may retain certain logs and records for security, verification, dispute handling, and legal compliance.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">16) Governing Law and Venue</h2>
                        <p>
                            These Terms are governed by the laws of the Republic of the Philippines. Any disputes will be brought in the proper courts of Cebu City, Philippines, unless required otherwise by law.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">17) Changes to These Terms</h2>
                        <p>
                            We may update these Terms. We will update the "Last Updated" date and may provide additional notice for major changes. Continued use of the Service means you accept the updated Terms.
                        </p>
                    </section>

                    <section className="mb-10">
                        <h2 className="text-2xl font-semibold mb-4">18) Contact</h2>
                        <p className="mb-2">
                            <strong>Support:</strong> <a href="mailto:support@rentercheck.ph" className="text-primary hover:underline">support@rentercheck.ph</a>
                        </p>
                        <p>
                            <strong>Privacy / Disputes:</strong> <a href="mailto:privacy@rentercheck.ph" className="text-primary hover:underline">privacy@rentercheck.ph</a>
                        </p>
                    </section>
                </div>
            </div>

            <Footer />
        </main>
    )
}
