import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Privacy Policy | InspecTech",
  description: "Privacy Policy for InspecTech - Inspection and Inventory Management System.",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-theme-sm p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h1>

          <p className="text-gray-600 mb-8">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                1. Introduction
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to InspecTech. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                2. Data We Collect
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We may collect, use, store and transfer different kinds of personal data about you, which we have grouped together as follows:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Identity Data includes first name, last name, username or similar identifier.</li>
                <li>Contact Data includes email address and telephone numbers.</li>
                <li>Profile Data includes your username and password, purchases or orders made by you.</li>
                <li>Technical Data includes internet protocol (IP) address, your login data.</li>
                <li>Usage Data includes information about how you use our website, products and services.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                3. How We Use Your Data
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>To register you as a new customer.</li>
                <li>To process and deliver your orders.</li>
                <li>To manage our relationship with you.</li>
                <li>To administer and protect our business and website.</li>
                <li>To deliver relevant website content and advertisements to you.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                4. Data Security
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. We limit access to your personal data to those employees, agents, contractors and other third parties who have a business need to know.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                5. Your Legal Rights
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Under certain circumstances, you have rights under data protection laws in relation to your personal data including the right to request access, correction or erasure of your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                6. Contact Us
              </h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this privacy policy, please contact us through our support channels or email us at support@inspectech.com.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
