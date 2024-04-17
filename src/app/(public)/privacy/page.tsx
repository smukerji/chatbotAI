"use client";
import React, { useState } from "react";
import "../terms/terms.scss";
import SecondaryHeader from "../../_components/Secondary-Header/SecondaryHeader";
import Footer from "../../_components/Footer/Footer";

function Terms() {
  return (
    <>
      <SecondaryHeader />
      <div className="terms-privacy-container">
        <h1>Privacy Policy</h1>
        <p className="last-modified">Last modified: February 27, 2024</p>
        <div className="term-container">
          <p>1. Introduction</p>
          <p>
            Please read this Privacy Policy (“Privacy Policy”) before using our
            Service including the Website, Widget and API (as defined below),
            referred to collectively as the “Service”. This Privacy Policy
            governs the types of information and data we collect and how we use
            and share this information. Your access to and use of the Service
            are available for your use only on the condition that you agree to
            the Terms & Conditions available under the following address:
            <a href={`/terms`}>{process.env.NEXT_PUBLIC_WEBSITE_URL}terms</a>
            (“Terms & Conditions”) which include the terms of the Privacy Policy
            set forth below. Torri.AI (“Company”) operates the Service.We use
            your data to provide and improve Service. By using Service, you
            agree to the collection and use of information in accordance with
            this policy. Unless otherwise defined in this Privacy Policy, the
            terms used in this Privacy Policy have the same meanings as in our
            Terms & Conditions.
          </p>
        </div>
        <div className="term-container">
          <p>2. Types of Data Collected</p>
          <h3>Personal Data</h3>
          <p>
            While using our Service, we may ask you to provide us with certain
            personally identifiable information that can be used to contact or
            identify you (“Personal Data”), including:
          </p>
          <ul>
            <li>email address,</li>
            <li>first name and last name,</li>
            <li>Cookies and Usage Data.</li>
          </ul>

          <h3>Usage Data</h3>
          <p>
            We may also collect information that your browser sends whenever you
            visit our Service or when you access Service by or through a Device
            (“Usage Data”). This Usage Data may include information such as your
            computer&apos;s Internet Protocol address (e.g. IP address), browser
            type, browser version, the pages of our Service that you visit, the
            time and date of your visit, the time spent on those pages, unique
            Device identifiers and other diagnostic data. When you access
            Service with a Device, this Usage Data may include information such
            as the type of Device you use, your Device unique ID, the IP address
            of your Device, your operating system, the type of Internet browser
            you use, unique Device identifiers and other diagnostic data.
          </p>

          <h3>Tracking Cookies Data</h3>
          <p>
            We use cookies and similar tracking technologies to track the
            activity on our Service and we hold certain information. Cookies are
            files with a small amount of data which may include an anonymous
            unique identifier. Cookies are sent to your browser from a website
            and stored on your Device. Other tracking technologies are also used
            such as beacons, tags and scripts to collect and track information
            and to improve and analyze our Service. You can instruct your
            browser to refuse all cookies or to indicate when a cookie is being
            sent. However, if you do not accept cookies, you may not be able to
            use some portions of our Service. Examples of Cookies we use:
          </p>
          <ul>
            <li>
              Session Cookies: We use Session Cookies to operate our Service,
            </li>
            <li>
              Preference Cookies: We use Preference Cookies to remember your
              preferences and various settings,
            </li>
            <li>
              Security Cookies: We use Security Cookies for security purposes,
            </li>
            <li>
              Advertising Cookies: Advertising Cookies are used to serve you
              with advertisements that may be relevant to you and your
              interests.
            </li>
          </ul>
        </div>

        <div className="term-container">
          <p>3. Use of Data</p>
          <p>
            Torri.AI uses the collected Personal Data for various purposes:
          </p>

          <ul>
            <li>
              to provide and maintain our Service; type of Personal Data: email
              address, first name and last name, Cookies and Usage Data;
              necessity for the performance of a contract to which you are a
              party;
            </li>
            <li>
              to notify you about changes to our Service; type of Personal Data:
              email address, first name and last name, Cookies and Usage Data;
              necessity for the performance of a contract to which you are a
              party;
            </li>
            <li>
              to allow you to participate in interactive features of our Service
              when you choose to do so; type of Personal Data: email address,
              first name and last name, Cookies and Usage Data; necessity for
              the performance of a contract to which you are a party;
            </li>
            <li>
              to provide customer support; type of Personal Data: email address,
              first name and last name, Cookies and Usage Data; necessity for
              the performance of a contract to which you are a party;
            </li>
            <li>
              to gather analysis or valuable information so that we can improve
              our Service; type of Personal Data: email address, first name and
              last name, Cookies and Usage Data; legitimate interests of the
              Data Controller;
            </li>
            <li>
              to monitor the usage of our Service; type of Personal Data: email
              address, first name and last name, Cookies and Usage Data;
              legitimate interests of the Data Controller;
            </li>
            <li>
              to detect, prevent and address technical issues; type of Personal
              Data: email address, first name and last name, Cookies and Usage
              Data; legitimate interests of the Data Controller;
            </li>
            <li>
              to fulfill any other purpose for which you provide it; type of
              Personal Data: email address, first name and last name, Cookies
              and Usage Data; necessity for the performance of a contract to
              which you are a party;
            </li>
            <li>
              to carry out our obligations and enforce our rights arising from
              any contracts entered into between you and us, including for
              billing and collection; type of Personal Data: email address,
              first name and last name, Cookies and Usage Data; necessity for
              the performance of a contract to which you are a party;
            </li>
            <li>
              to provide you with notices about your account and/or
              subscription, including expiration and renewal notices,
              email-instructions, etc.; type of Personal Data: email address,
              first name and last name, Cookies and Usage Data; necessity for
              the performance of a contract to which you are a party;
            </li>
            <li>
              to provide you with news, special offers and general information
              about other goods, services and events which we offer that are
              similar to those that you have already purchased or enquired about
              unless you have opted not to receive such information; type of
              Personal Data: email address, first name and last name, Cookies
              and Usage Data; upon your consent;
            </li>
            <li>
              in any other way we may describe when you provide the information;
              type of Personal Data: email address, first name and last name,
              Cookies and Usage Data; necessity for the performance of a
              contract to which you are a party;
            </li>
          </ul>
        </div>

        <div className="term-container">
          <p>4. Retention of Data</p>
          <p>
            We will retain your Personal Data only for as long as is necessary
            for the purposes set out in this Privacy Policy. We will retain and
            use your Personal Data to the extent necessary to comply with our
            legal obligations (for example, if we are required to retain your
            data to comply with applicable laws), resolve disputes, and enforce
            our legal agreements and policies. Your Personal Data processed upon
            your consent will be stored for as long as the relevant consent is
            not withdrawn and until the expiration of claims resulting from the
            Service. We will also retain Usage Data for internal analysis
            purposes. Usage Data is generally retained for a shorter period,
            except when this data is used to strengthen the security or to
            improve the functionality of our Service, or we are legally
            obligated to retain this data for longer time periods.
          </p>
        </div>
        <div className="term-container">
          <p>5. Transfer of Data</p>
          <p>
            Your information, including Personal Data, may be transferred to –
            and maintained on – computers located outside of your state,
            province, country or other governmental jurisdiction where the data
            protection laws may differ from those of your jurisdiction. If you
            are located outside United States and choose to provide information
            to us, please note that we transfer the data, including Personal
            Data, to United States and process it there. The Company will take
            all the steps reasonably necessary to ensure that your data is
            treated securely and in accordance with this Privacy Policy and no
            transfer of your Personal Data will take place to an organization or
            a country unless there are adequate controls in place including the
            security of your data and other personal information. When we
            transfer your Personal Data to other countries, we will protect that
            Personal Data as described in this Privacy Policy and in accordance
            with applicable law. We use contractual protections for the transfer
            of Personal Data among various jurisdictions (the European
            Commission’s standard contractual clauses referred to in Article 46.
            2 c) of the GDPR).
          </p>
        </div>

        <div className="term-container">
          <p>6. Security of Data</p>
          <p>
            The security of your data is important to us but remember that no
            method of transmission over the Internet or method of electronic
            storage is 100% secure. We use appropriate administrative, technical
            and physical safeguards to protect the Personal Data you provide
            against accidental, unlawful or unauthorized destruction, loss,
            alteration, access, disclosure or use, e.g. we maintain backup
            copies and only authorized personnel may access the Personal Data.
          </p>
        </div>

        <div className="term-container">
          <p>7. Service Providers</p>
          <p>
            We may employ third party companies and individuals to facilitate
            our Service (“Service Providers”), provide Service on our behalf,
            perform Service-related services or assist us in analysing how our
            Service is used. These third parties have access to your Personal
            Data only to perform these tasks on our behalf and are obligated not
            to disclose or use it for any other purpose.
          </p>
        </div>
        <div className="term-container">
          <p>8. Payments</p>
          <p>
            We may provide paid products and/or services within Service. In that
            case, we use third-party services for payment processing (e.g.
            payment processors). We will not store or collect your payment card
            details. That information is provided directly to our third-party
            payment processors whose use of your personal information is
            governed by their Privacy Policy. These payment processors adhere to
            the standards set by PCI-DSS as managed by the PCI Security
            Standards Council, which is a joint effort of brands like Visa,
            Mastercard, American Express and Discover. PCI-DSS requirements help
            ensure the secure handling of payment information. The payment
            processors we work with are:
          </p>

          <ul>
            <li>
              Stripe - Privacy Policy of Stripe Inc. can be viewed at:
              https://stripe.com/us/privacy.
            </li>
          </ul>
        </div>

        <div className="term-container">
          <p>9. Contact Us</p>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at info@sapahk.ai.
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Terms;
