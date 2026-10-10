import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | Influencer Dhundo" },
      {
        name: "description",
        content: "Privacy Policy for Influencer Dhundo - how we collect, use, and protect your information.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://www.influencerdhundo.com/privacy" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-4xl px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Last Updated: 3 October 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <p>
            Influencer Dhundo (“Influencer Dhundo”, “we”, “us”, or “our”) operates a platform that helps local businesses discover local influencers and content creators and enables creators to make their profiles discoverable to businesses.
          </p>
          <p>
            This Privacy Policy explains how we collect, use, disclose, store and protect information when you use our website, platform and related services (collectively, the “Platform”).
          </p>
          <p>
            By using the Platform, you acknowledge that you have read and understood this Privacy Policy.
          </p>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              1. Information We Collect
            </h2>
            <p>
              We collect information that you provide to us, information generated through your use of the Platform, and information received from service providers where necessary to provide our services.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              A. Information Provided by Creators
            </h3>
            <p>When you create a creator account or profile, we may collect:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Name</li>
              <li>Creator/display name</li>
              <li>Email address</li>
              <li>Mobile number</li>
              <li>Profile photograph</li>
              <li>City</li>
              <li>Locality</li>
              <li>Pincode</li>
              <li>About/bio information</li>
              <li>Instagram username or profile link</li>
              <li>Follower count</li>
              <li>Links to other social media profiles you choose to provide</li>
              <li>Content categories</li>
              <li>Content types</li>
              <li>Languages</li>
              <li>Collaboration preferences</li>
              <li>Starting collaboration price</li>
              <li>Optional pricing for specific content formats</li>
              <li>Travel preferences and travel range</li>
              <li>Whether you accept products or services for collaborations</li>
              <li>Typical content turnaround time</li>
              <li>Information relating to your subscription</li>
              <li>Referral information and referral activity</li>
            </ul>
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              You are responsible for ensuring that the information you provide is accurate and that you have the right to provide any information, photographs or social media links that you submit.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              B. Information Provided by Businesses
            </h3>
            <p>When a business creates an account or uses business-related features, we may collect:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Name</li>
              <li>Business name</li>
              <li>Email address</li>
              <li>Mobile number</li>
              <li>Information required to maintain and manage the business account</li>
              <li>Information relating to creator contact access</li>
              <li>Subscription or transaction-related information, where applicable</li>
            </ul>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              C. Payment and Subscription Information
            </h3>
            <p>
              When you purchase a subscription or make a payment through the Platform, payment transactions may be processed through third-party payment service providers, including Razorpay.
            </p>
            <p>We may receive information such as:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Payment status</li>
              <li>Transaction or order ID</li>
              <li>Subscription plan</li>
              <li>Amount paid</li>
              <li>Payment date</li>
              <li>Refund or payment reversal status</li>
              <li>Other information necessary to confirm and manage the transaction</li>
            </ul>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We do not intend to store your full card number, UPI credentials, banking passwords or other complete payment instrument credentials on our servers. Payment information may be processed directly by the relevant payment service provider in accordance with its own privacy policy and terms.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              D. Referral Information
            </h3>
            <p>If you participate in our creator referral programme, we may collect and use information relating to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Your referral code or referral link</li>
              <li>The creator who referred you</li>
              <li>Creators you refer</li>
              <li>Successful referrals</li>
              <li>Subscription purchases associated with referrals</li>
              <li>Referral-earned subscription extensions</li>
              <li>Reversed referral rewards resulting from refunds or payment reversals</li>
            </ul>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This information is used to administer the referral programme, calculate rewards and prevent misuse or fraudulent referrals.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              E. Information Collected Automatically
            </h3>
            <p>When you use the Platform, we may automatically collect limited technical and usage information, such as:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device type</li>
              <li>Operating system</li>
              <li>Pages or sections visited</li>
              <li>Approximate usage information</li>
              <li>Date and time of access</li>
              <li>Log and diagnostic information</li>
              <li>Information necessary for security and fraud prevention</li>
            </ul>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We may use cookies and similar technologies to maintain sessions, remember preferences, understand usage and improve the Platform.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              2. How We Use Your Information
            </h2>
            <p>We may use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Create and manage user accounts.</li>
              <li>Create, maintain and display creator profiles.</li>
              <li>Help businesses discover creators based on relevant search and filter criteria.</li>
              <li>Allow eligible businesses to access creator contact information in accordance with our Platform rules.</li>
              <li>Enable creators and businesses to connect directly.</li>
              <li>Process subscriptions and payments.</li>
              <li>Manage trials, subscriptions, renewals and cancellations.</li>
              <li>Administer our creator referral programme.</li>
              <li>Calculate and apply referral rewards or reversals.</li>
              <li>Prevent self-referrals, fraudulent activity, abuse and misuse of the Platform.</li>
              <li>Provide customer support.</li>
              <li>Communicate with you about your account, subscription, transactions or important Platform updates.</li>
              <li>Maintain the security and functionality of the Platform.</li>
              <li>Monitor and improve Platform performance and user experience.</li>
              <li>Investigate reports of misuse or violations of our policies.</li>
              <li>Comply with applicable laws, regulations and legal obligations.</li>
              <li>Establish, exercise or defend legal claims where necessary.</li>
            </ul>
            <p>
              We will use personal information only for legitimate and relevant purposes connected with operating and improving Influencer Dhundo.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              3. Information Displayed on Creator Profiles
            </h2>
            <p>
              Influencer Dhundo is a creator discovery platform. The purpose of creating a creator profile is to allow businesses to discover and evaluate creators for potential collaborations.
            </p>
            <p>Information that may be publicly displayed on a creator profile can include:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Creator/display name</li>
              <li>Profile photograph</li>
              <li>City and locality</li>
              <li>Instagram profile and other social links provided by the creator</li>
              <li>Follower count</li>
              <li>About/bio</li>
              <li>Broad content category</li>
              <li>Content types</li>
              <li>Languages</li>
              <li>Collaboration preferences</li>
              <li>Starting price</li>
              <li>Travel preferences</li>
              <li>Product/service collaboration preferences</li>
              <li>Typical turnaround time</li>
              <li>Other information intentionally provided by the creator for public display</li>
            </ul>
            <p className="text-xs sm:text-sm text-muted-foreground italic">
              Creators should not include private, sensitive or confidential information in fields intended for public display.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              4. Contact Information
            </h2>
            <p>
              A creator's phone number, WhatsApp number and email address are not intended to be publicly displayed to anonymous visitors.
            </p>
            <p>
              Where applicable, certain creator contact information may be made available to registered businesses through the Platform in accordance with our access rules.
            </p>
            <p>
              Creators are responsible for deciding which contact information they provide for potential business enquiries.
            </p>
            <p>
              Businesses that obtain creator contact information must use it only for legitimate business and collaboration-related communication and must not misuse, sell, distribute or otherwise exploit such information.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              5. Social Media Information
            </h2>
            <p>
              Creators may voluntarily provide links, usernames or other information relating to their social media profiles. Social media profiles linked by creators may be publicly accessible through the relevant social media platform.
            </p>
            <p>
              Influencer Dhundo does not control the privacy settings, content or practices of third-party social media platforms. Creators should review the privacy policies and settings of the relevant social media platforms.
            </p>
            <p>
              If Influencer Dhundo introduces an account-connection feature that allows creators to connect a social media account directly to the Platform, we will provide appropriate information about the data accessed and how it is used.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              6. Sharing of Information
            </h2>
            <p>We may share information in the following circumstances:</p>

            <h3 className="text-lg font-semibold text-foreground pt-1">
              A. With Other Platform Users
            </h3>
            <p className="text-muted-foreground">
              Information intentionally made public as part of a creator profile may be visible to businesses and other visitors. Creator contact information may be made available to eligible registered businesses according to the Platform's access rules.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-1">
              B. With Service Providers
            </h3>
            <p className="text-muted-foreground">
              We may use third-party service providers that help us operate the Platform, including providers for hosting and infrastructure, database and storage, payment processing, email and communications, security, analytics and monitoring, and technical support. These providers may process information on our behalf and are expected to handle information in accordance with applicable requirements.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-1">
              C. Legal and Regulatory Requirements
            </h3>
            <p className="text-muted-foreground">
              We may disclose information where reasonably necessary to comply with applicable law or legal processes, respond to lawful requests from authorities, protect our rights or property, investigate suspected fraud or misuse, protect the security of our Platform or users, and establish, exercise or defend legal claims.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-1">
              D. Business Transfers
            </h3>
            <p className="text-muted-foreground">
              If Influencer Dhundo or substantially all of its assets are involved in a merger, acquisition, restructuring, financing, sale or similar transaction, relevant information may be transferred as part of that transaction, subject to applicable law.
            </p>
            <p className="font-semibold text-foreground">
              We do not sell personal information as a product to third parties.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              7. Payment Processing
            </h2>
            <p>
              Payments made through Influencer Dhundo may be processed by third-party payment service providers such as Razorpay. When you make a payment, you may be redirected to or interact with the payment provider's systems. The payment provider may independently process information necessary to complete and secure the transaction.
            </p>
            <p>Influencer Dhundo may receive transaction-related information required to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Confirm payment</li>
              <li>Activate a subscription</li>
              <li>Record subscription dates</li>
              <li>Process refunds</li>
              <li>Manage payment reversals</li>
              <li>Administer referral rewards</li>
              <li>Provide customer support</li>
              <li>Maintain transaction records</li>
            </ul>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Your use of third-party payment services may also be subject to the payment provider's terms and privacy policy.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              8. Data Security
            </h2>
            <p>
              We take reasonable measures to protect personal information against unauthorised access, alteration, disclosure, misuse or destruction. These measures may include appropriate technical, administrative and organisational safeguards.
            </p>
            <p>
              However, no website, online service or method of electronic transmission can be guaranteed to be completely secure. You are responsible for maintaining the confidentiality of any account credentials or access mechanisms associated with your account and should notify us if you believe your account has been accessed or used without authorization.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              9. Data Retention
            </h2>
            <p>We retain personal information for as long as reasonably necessary to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Provide and maintain our services.</li>
              <li>Maintain your account and profile.</li>
              <li>Process transactions.</li>
              <li>Manage subscriptions and referrals.</li>
              <li>Prevent fraud and misuse.</li>
              <li>Provide customer support.</li>
              <li>Resolve disputes.</li>
              <li>Maintain appropriate business and transaction records.</li>
              <li>Comply with legal, regulatory or accounting requirements.</li>
              <li>Establish, exercise or defend legal claims.</li>
            </ul>
            <p>
              When information is no longer required for these purposes, we may delete, anonymise or otherwise dispose of it in accordance with applicable law and our internal retention practices.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              10. Your Choices and Rights
            </h2>
            <p>Subject to applicable law, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>Access personal information we hold about you.</li>
              <li>Request correction of inaccurate or incomplete information.</li>
              <li>Update information associated with your account.</li>
              <li>Request deletion of your account or personal information where applicable.</li>
              <li>Withdraw consent where processing is based on consent.</li>
              <li>Raise questions or concerns regarding the handling of your personal information.</li>
            </ul>
            <p>
              Some information may need to be retained where required by law or where necessary for legitimate business, security, fraud prevention, transaction or dispute-resolution purposes.
            </p>
            <p>
              To make a privacy-related request, please contact us using the details provided below.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              11. Creator Profile Removal
            </h2>
            <p>
              Creators may request removal of their profile or account.
            </p>
            <p>
              If a creator's subscription expires, their profile may become inactive or unavailable for discovery in accordance with the Platform's subscription rules.
            </p>
            <p>
              Deletion or removal of a profile does not necessarily mean that all information will be immediately deleted. Certain transaction, payment, security, fraud-prevention or legal records may need to be retained for an appropriate period.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              12. Third-Party Websites and Services
            </h2>
            <p>
              The Platform may contain links to third-party websites, including social media platforms and other external services. We are not responsible for the privacy practices, content, security or policies of third-party websites or services. Your interaction with those services is governed by their respective terms and privacy policies.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              13. Children
            </h2>
            <p>
              Influencer Dhundo is intended for individuals who are <strong>18 years of age or older</strong>. We do not knowingly provide services to or intentionally collect personal information from individuals under 18.
            </p>
            <p>
              If you believe that a person under 18 has provided personal information to us, please contact us so that we can take appropriate action.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              14. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes to our Platform, our services, our data practices, applicable laws or regulations, or security/operational requirements.
            </p>
            <p>
              When we make changes, we will update the <strong>“Last Updated”</strong> date at the beginning of this Privacy Policy. Where appropriate, we may also provide additional notice through the Platform or by email.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              15. Contact Us
            </h2>
            <p>
              If you have questions, requests or concerns regarding this Privacy Policy or the way we handle personal information, please contact us:
            </p>
            <div className="rounded-2xl bg-secondary/50 p-5 border border-border space-y-1 text-sm">
              <p className="font-semibold text-foreground">Influencer Dhundo</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a
                  href="mailto:influencerdhundo@gmail.com"
                  className="text-primary font-medium hover:underline"
                >
                  influencerdhundo@gmail.com
                </a>
              </p>
              <p className="text-muted-foreground">
                Website:{" "}
                <a
                  href="https://www.influencerdhundo.com"
                  className="text-primary font-medium hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  www.influencerdhundo.com
                </a>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              For privacy-related requests, concerns or complaints, please contact us at the email address above.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
