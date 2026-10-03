import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy | Influencer Dhundo" },
      {
        name: "description",
        content: "Refund and Cancellation Policy for Influencer Dhundo creator subscriptions and services.",
      },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
  return (
    <div className="py-12 md:py-16 bg-background">
      <div className="mx-auto max-w-4xl px-5 sm:px-6">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-border">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground tracking-tight">
            Refund &amp; Cancellation Policy
          </h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Last Updated: 3 October 2026
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-foreground/90 leading-relaxed text-sm sm:text-base">
          <p>
            This Refund &amp; Cancellation Policy explains how cancellations, refunds, failed payments, duplicate payments and subscription-related adjustments are handled for Influencer Dhundo.
          </p>
          <p>
            This Policy applies to payments made for creator subscriptions and other paid services offered directly by Influencer Dhundo through its website or authorised payment partners.
          </p>
          <p>
            By purchasing a subscription or paid service from Influencer Dhundo, you acknowledge that you have read and understood this Policy.
          </p>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              1. Nature of Our Service
            </h2>
            <p>
              Influencer Dhundo provides a digital creator-discovery and listing service.
            </p>
            <p>
              A creator subscription provides access to the applicable paid features and, subject to the Platform's activation requirements, allows the creator's profile to remain publicly discoverable for the purchased subscription period.
            </p>
            <p>
              Because the service is digital and access may be activated immediately after successful payment, subscription payments are generally non-refundable once the subscription has been successfully activated, except in the circumstances specifically described in this Policy.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              2. Free Trial
            </h2>
            <p>
              Eligible new creators may receive a 3-day free trial.
            </p>
            <p>
              The trial allows the creator to use the applicable features during the trial period without purchasing a paid subscription.
            </p>
            <p>
              No refund is applicable to the free trial because no subscription payment has been collected for the trial.
            </p>
            <p>
              At the end of the trial period, the creator must purchase an available paid subscription to continue having an active publicly discoverable profile.
            </p>
            <p>
              The free trial does not automatically qualify as a paid subscription or generate referral rewards.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              3. Subscription Cancellation
            </h2>
            <p>
              Creators may choose to stop using Influencer Dhundo at any time.
            </p>
            <p>
              However, cancelling or stopping use of a subscription does not automatically entitle the creator to a refund for unused subscription time.
            </p>
            <p>
              Once a paid subscription has been activated, the subscription generally remains valid until its stated expiry date.
            </p>
            <p>
              For example, if a creator purchases a six-month subscription and stops using the Platform after two months, the unused four months are generally not refundable. This is because the subscription provides access to a digital service for the purchased subscription period.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              4. Subscription Refunds
            </h2>
            <p>
              Subscription payments are generally non-refundable after successful activation. However, a refund may be considered in the following circumstances:
            </p>
            <div className="space-y-3 pl-2 sm:pl-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  A. Payment successful but subscription not activated
                </h3>
                <p className="text-muted-foreground text-sm">
                  If payment has been successfully completed but the corresponding subscription is not activated because of a verified technical issue on our side, we will first attempt to correct the activation issue. If we are unable to provide the purchased subscription within a reasonable period, the customer may request a refund.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  B. Duplicate payment
                </h3>
                <p className="text-muted-foreground text-sm">
                  If the same subscription is accidentally charged more than once because of a verified technical or payment-processing error, the duplicate payment may be refunded.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  C. Incorrect amount charged
                </h3>
                <p className="text-muted-foreground text-sm">
                  If you were incorrectly charged an amount different from the applicable amount displayed at checkout because of a verified technical error, we may correct the transaction or refund the incorrectly charged amount, as applicable.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  D. Payment captured but order/subscription not created
                </h3>
                <p className="text-muted-foreground text-sm">
                  If money has been successfully deducted but the corresponding subscription order cannot be created or activated due to a verified technical failure, we will investigate the transaction and either activate the applicable subscription or process an eligible refund.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  E. Other legally required refunds
                </h3>
                <p className="text-muted-foreground text-sm">
                  Nothing in this Policy limits any refund, cancellation or consumer right that cannot legally be excluded under applicable law.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              5. No Refund for Lack of Leads or Collaborations
            </h2>
            <p>
              A subscription is a payment for access to Influencer Dhundo's digital discovery/listing service. Therefore, a refund will generally not be available because a creator:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>did not receive enquiries;</li>
              <li>did not receive collaboration offers;</li>
              <li>received fewer enquiries than expected;</li>
              <li>did not receive a collaboration;</li>
              <li>did not receive a paid collaboration;</li>
              <li>did not receive a barter collaboration;</li>
              <li>did not receive enquiries from a particular city;</li>
              <li>did not receive enquiries from a particular category; or</li>
              <li>did not achieve a particular business or income result.</li>
            </ul>
            <p className="font-medium text-foreground">
              Influencer Dhundo does not guarantee a specific number of enquiries, collaborations, leads, followers, income or commercial results.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              6. Profile Visibility Issues
            </h2>
            <p>
              If a creator has an active paid subscription but their profile is not publicly visible because of a verified technical problem attributable to Influencer Dhundo, the creator should contact us at:
            </p>
            <p className="font-semibold text-primary">
              <a href="mailto:support@influencerdhundo.com" className="hover:underline">
                support@influencerdhundo.com
              </a>
            </p>
            <p className="text-muted-foreground">
              We will investigate the issue and, where appropriate, restore the profile or provide an appropriate adjustment.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              If a profile is hidden or suspended because of the creator's violation of the Terms &amp; Conditions, fraudulent activity, inaccurate information, prohibited content or other policy violation, this does not automatically create a refund entitlement.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              7. Referral Rewards and Refunds
            </h2>
            <p>
              Influencer Dhundo operates a creator referral programme. Under the current referral programme, an eligible creator receives 7 additional subscription days for each qualifying successful referral.
            </p>
            <p>A referral qualifies only when the referred creator:</p>
            <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
              <li>joins using the applicable referral link or code;</li>
              <li>completes the required creator registration/profile process; and</li>
              <li>purchases a qualifying paid subscription.</li>
            </ol>

            <div className="rounded-xl bg-secondary/50 p-4 border border-border text-sm space-y-1">
              <p className="font-semibold text-foreground">Example:</p>
              <p className="text-muted-foreground">Creator A refers Creator B.</p>
              <p className="text-muted-foreground">Creator B completes registration and purchases a qualifying subscription.</p>
              <p className="text-foreground font-medium">Creator A receives: +7 days — Creator B joined and subscribed</p>
            </div>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              7.1 Referral Reward Reversal
            </h3>
            <p>
              If the referred creator's qualifying subscription is subsequently refunded, cancelled or reversed in circumstances that make the original referral ineligible, the corresponding 7 referral days may be reversed.
            </p>
            <div className="rounded-xl bg-secondary/50 p-4 border border-border text-sm space-y-1">
              <p className="font-semibold text-foreground">For example:</p>
              <p className="text-tealdeep font-medium">+7 days — Rahul joined and subscribed</p>
              <p className="text-destructive font-medium">−7 days — Rahul's subscription was refunded</p>
              <p className="text-muted-foreground">The corresponding subscription expiry date may then be adjusted.</p>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This prevents a creator from retaining referral-earned subscription time when the underlying paid referral transaction has been reversed.
            </p>

            <h3 className="text-lg font-semibold text-foreground pt-2">
              7.2 Referral Reward Is Not Cash
            </h3>
            <p>
              Referral rewards are provided as additional subscription validity. They:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>cannot be converted into cash;</li>
              <li>cannot be withdrawn;</li>
              <li>cannot normally be transferred to another creator; and</li>
              <li>have no separate monetary value payable to the creator.</li>
            </ul>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              8. Refunds and Referral Rewards
            </h2>
            <p>
              Where a refund is issued for a referred creator's subscription, Influencer Dhundo may reverse the corresponding referral reward before or after processing the refund.
            </p>
            <p>
              If multiple referral rewards have been earned, only the reward associated with the refunded qualifying transaction will normally be reversed. The referral history may show the adjustment.
            </p>

            <div className="overflow-x-auto rounded-xl border border-border mt-3">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Referral activity</th>
                    <th className="p-3 text-right">Subscription adjustment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="p-3 text-muted-foreground">Creator A referred Rahul</td>
                    <td className="p-3 text-right font-mono text-tealdeep font-semibold">+7 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground">Creator A referred Priya</td>
                    <td className="p-3 text-right font-mono text-tealdeep font-semibold">+7 days</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-muted-foreground">Rahul's subscription refunded</td>
                    <td className="p-3 text-right font-mono text-destructive font-semibold">−7 days</td>
                  </tr>
                  <tr className="bg-secondary/40 font-semibold text-foreground">
                    <td className="p-3">Net additional days</td>
                    <td className="p-3 text-right font-mono text-tealdeep">+7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              9. Failed, Pending or Cancelled Payments
            </h2>
            <p>
              If a payment attempt fails before the transaction is successfully captured by Influencer Dhundo, no subscription is created for that unsuccessful payment attempt.
            </p>
            <p>
              If your bank, card issuer, UPI provider or payment service provider temporarily shows a debit despite the transaction failing, the amount may be automatically reversed by the relevant payment provider or bank according to its applicable processing timelines.
            </p>
            <p>
              If the amount does not reverse within the expected period, you may contact your payment provider and/or Influencer Dhundo with the relevant transaction details.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              10. Refund Processing
            </h2>
            <p>
              For an approved refund, Influencer Dhundo will initiate the refund through the applicable payment mechanism.
            </p>
            <p>
              Refunds will generally be routed to the same payment method used for the original transaction, subject to the payment provider's capabilities and applicable law.
            </p>
            <p>
              Once a refund has been initiated by Influencer Dhundo, the actual time taken for the amount to appear in the customer's account may depend on the bank, card network, UPI provider or other payment institution involved. Influencer Dhundo is not responsible for delays caused solely by such third-party payment providers.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              11. Refund Request Timeline
            </h2>
            <p>
              We recommend submitting refund requests as soon as the relevant issue is identified.
            </p>
            <p>
              To allow us to investigate the transaction properly, refund requests should normally be submitted within <strong>7 days</strong> of the relevant payment or transaction.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              This request period does not override any mandatory rights available to you under applicable law.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              12. How to Request a Refund
            </h2>
            <p>
              To request a refund or report a payment issue, email:
            </p>
            <p className="font-semibold text-primary">
              <a href="mailto:support@influencerdhundo.com" className="hover:underline">
                support@influencerdhundo.com
              </a>
            </p>
            <p>Please include:</p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>registered name;</li>
              <li>registered email address;</li>
              <li>registered mobile number;</li>
              <li>Razorpay payment/order ID, if available;</li>
              <li>transaction date;</li>
              <li>amount paid;</li>
              <li>subscription plan;</li>
              <li>reason for the refund request; and</li>
              <li>relevant screenshots or payment information where useful.</li>
            </ul>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Providing accurate transaction information helps us investigate the request more quickly.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              13. Refund Review Process
            </h2>
            <p>
              We will review the information provided and may verify the transaction with our payment processor. We may request additional information where necessary to verify:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>payment status;</li>
              <li>duplicate charges;</li>
              <li>subscription activation;</li>
              <li>technical issues;</li>
              <li>refund eligibility; or</li>
              <li>suspected misuse.</li>
            </ul>
            <p>
              We aim to acknowledge refund requests within 3 business days and, where sufficient information is available, communicate the outcome within 7–10 business days.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              These are our intended review timelines and do not necessarily represent the time required by a bank or payment provider to credit an approved refund.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              14. Taxes and Payment Processing Charges
            </h2>
            <p>
              Where a refund is approved, the amount refunded will be determined based on the applicable transaction, refund circumstances and applicable law.
            </p>
            <p>
              Where applicable, taxes may be treated in accordance with the requirements of law. Any payment gateway or transaction-related charges that are not recoverable by Influencer Dhundo may be treated according to the applicable transaction and refund circumstances, subject to applicable law.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground">
              We will not impose charges that are prohibited by applicable law.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              15. Fraud, Abuse and Misuse
            </h2>
            <p>
              Refunds and referral benefits are intended for genuine users and genuine transactions. We may investigate and take appropriate action where we reasonably suspect:
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground">
              <li>fraudulent transactions;</li>
              <li>self-referrals;</li>
              <li>duplicate or artificial accounts;</li>
              <li>manipulation of referral rewards;</li>
              <li>repeated creation of accounts to obtain trials;</li>
              <li>payment abuse;</li>
              <li>misuse of refund procedures;</li>
              <li>false refund claims; or</li>
              <li>attempts to circumvent subscription restrictions.</li>
            </ul>
            <p>
              Where fraud or abuse is established, we may suspend or terminate the relevant account and reverse associated referral rewards, subject to applicable law.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              16. Chargebacks and Payment Disputes
            </h2>
            <p>
              If you believe that a payment was incorrectly charged, please contact us first at:
            </p>
            <p className="font-semibold text-primary">
              <a href="mailto:support@influencerdhundo.com" className="hover:underline">
                support@influencerdhundo.com
              </a>
            </p>
            <p className="text-muted-foreground">
              We will review the transaction and attempt to resolve legitimate payment issues. Nothing in this section prevents a customer from exercising any rights available under applicable law or applicable payment-network rules.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              17. Cancellation of Future Renewal
            </h2>
            <p>
              If Influencer Dhundo introduces automatic subscription renewal in the future, the applicable cancellation mechanism and renewal terms will be displayed before or during the renewal process.
            </p>
            <p>
              Unless otherwise stated at checkout, cancelling future renewal will not automatically cancel the already-paid subscription period. The creator's existing paid access may continue until the end of the applicable subscription period.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              18. Changes to This Policy
            </h2>
            <p>
              We may update this Refund &amp; Cancellation Policy from time to time to reflect changes to our services, subscription plans, referral programme, payment processing, applicable law, or operational requirements.
            </p>
            <p>
              The latest version will be published on the Platform with the updated “Last Updated” date. Changes will not retroactively remove rights that have already accrued under applicable law.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              19. Relationship With Our Terms &amp; Conditions
            </h2>
            <p>
              This Refund &amp; Cancellation Policy forms part of the Influencer Dhundo Terms &amp; Conditions.
            </p>
            <p>
              If there is a conflict between this Policy and the Terms &amp; Conditions specifically relating to refunds or cancellations, the provisions specifically dealing with refunds and cancellations in this Policy will apply, subject to applicable law.
            </p>
          </section>

          <hr className="border-border my-6" />

          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-display font-semibold text-foreground">
              20. Contact
            </h2>
            <p>
              For refund, cancellation or payment-related questions:
            </p>
            <div className="rounded-2xl bg-secondary/50 p-5 border border-border space-y-1 text-sm">
              <p className="font-semibold text-foreground">Influencer Dhundo</p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a
                  href="mailto:support@influencerdhundo.com"
                  className="text-primary font-medium hover:underline"
                >
                  support@influencerdhundo.com
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
          </section>
        </div>
      </div>
    </div>
  );
}
