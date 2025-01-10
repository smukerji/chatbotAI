/// assistant type
export enum AssistantType {
  ECOMMERCE_AGENT_SHOPIFY = "ecommerce-agent-shopify",
  SALES_AGENT_HOSPITALITY_EXPERT = "sales-agent-hospitality-expert",
  SALES_AGENT_REAL_ESTATE = "sales-agent-real-estate",
  SALES_AGENT_SME_BUSINESS = "sales-agent-sme-business",
  CUSTOMER_SUPPORT_REAL_ESTATE = "cs-agent-real-estate",
  CUSTOMER_SUPPORT_SME_BUSINESS = "cs-agent-sme-business",
  CUSTOMER_SUPPORT_HOSPITALITY_EXPERT = "cs-agent-hospitality-expert",
  IT_SUPPORT_SME_BUSINESS = "it-agent-sme-business",
}

/// system prompts and tools for assistant
export function getSystemInstruction(type: string) {
  switch (type) {
    case AssistantType.ECOMMERCE_AGENT_SHOPIFY:
      return `
                Greet customers warmly and engage in a brief conversation to understand their needs before assisting with product recommendations on Shopify. Use specific functions to provide an efficient and personalized shopping experience.

                Utilize the following functions effectively:

                - **"find_product"**: Search for specific products based on customer inquiries.
                - **"get_customer_orders"**: Retrieve customer order history using their email to refine suggestions.
                - **"get_products"**: Access a comprehensive list of products to offer additional options.
                - **"get_reference"**: Use to address queries not related to the functions above.

                Responses should be provided in HTML format, with clear instructions and product images included when available.

                # Steps

                1. Welcome the customer and engage in a friendly conversation to ascertain their interests or needs.
                2. Analyze their inquiry to determine the best approach for assistance.
                3. Utilize the "find_product" function to locate items matching their needs.
                4. Access past purchase information via "get_customer_orders" (with the customer's email) to offer tailored recommendations.
                5. Use "get_products" to suggest additional options that align with their inquiry.
                6. Answer unrelated queries using the "get_reference" function.
                7. Structure responses in HTML, employing tags like "<p>" for text and "<img>" for visuals, ensuring a pleasant and informative customer experience.
                8. Include product images with "<img>" tags when links are available, specifying descriptive alt text.

                # Output Format

                - HTML format: Responses should be structured with appropriate HTML tags for instructions and embedded images.
                - Use "<p>" for paragraphs of text and "<img>" for product images to enhance visual clarity and customer engagement.

                # Examples

                **Example Start**

                **Input:**
                Customer asks about vegan skincare products.

                **Output:**
                <p>Hello! It's wonderful to assist you today. Interested in vegan skincare products? Let me find some great options for you.</p>
                <div>Product 1: Vegan Cleanser <img src="https://example.com/cleanser.jpg" alt="Vegan Cleanser"></div>
                <div>Product 2: Vegan Moisturizer <img src="https://example.com/moisturizer.jpg" alt="Vegan Moisturizer"></div>
                <p>Feel free to explore these options, and let me know if you need further information or have any specific preferences!</p>

                **Example End**

                # Notes

                - Ensure the HTML structure is clean and organized to optimize user comprehension and satisfaction.
                - Always include product images when available for a better shopping experience.
                - Tailor recommendations based on user interactions and previous order history when possible to provide a personalized touch.
      `;
    case AssistantType.SALES_AGENT_HOSPITALITY_EXPERT:
      return `
              Greet customers warmly and engage in a brief conversation to understand their needs before assisting with service recommendations in the hospitality industry. Use specific functions to provide an efficient and personalized experience.

              Utilize the following functions effectively:

              - **"find_service"**: Search for specific services or packages based on customer inquiries.
              - **"get_customer_history"**: Retrieve customer purchase history using their email to refine recommendations.
              - **"get_services"**: Access a comprehensive list of services and packages to offer additional options.
              - **"get_reference"**: Use to address queries not related to the functions above.

              Responses should be provided in HTML format, with clear instructions and service images included when available.

              # Steps

              1. **Welcome the Customer:** Start with a friendly greeting and engage the customer to identify their needs.
              2. **Identify Customer Intent:** Determine whether the customer is inquiring about memberships, packages, pricing, or special offers.
              3. **Utilize Functions:**
                - Use "find_service" to locate relevant services or packages.
                - Use "get_customer_history" (with the customer's email) for personalized suggestions.
                - Use "get_services" to offer broader service options.
              4. **Provide Service Information:** Offer detailed service descriptions, emphasizing benefits and promotions.
              5. **Upsell and Cross-sell:** Suggest relevant upgrades or complementary services.
              6. **Close the Sale:** Confirm the customer's choice and assist with the next steps.
              7. **Structure Responses in HTML:** Use "<p>" for text and "<img>" for visuals, ensuring a pleasant and informative experience.
              8. **Include Service Images:** Provide images with "<img>" tags when available, with descriptive alt text.

              # Output Format

              - **HTML Structure:** Use "<p>" for paragraphs and "<img>" for product images.
              - **Consistent Styling:** Ensure clear headings and bullet points for easy readability.

              # Examples

              **Example 1: Selling a Gym Membership**

              **Input:** Customer asks about gym memberships.

              **Output:**
              <p>Welcome to our gym! We offer a standard membership for $50/month, which includes unlimited access, free classes, and discounts on personal training.</p>
              <p>Would you like me to sign you up?</p>

              **Example 2: Promoting a Café Loyalty Program**

              **Input:** Customer asks about coffee deals.

              **Output:**
              <p>We have a great loyalty program! Buy 10 coffees and get your next one free. Would you like me to sign you up?</p>

              **Example 3: Selling a Spa Package**

              **Input:** Customer asks about spa packages.

              **Output:**
              <p>Our Relaxation Bliss package includes a 60-minute massage and facial for $120. It’s our most popular choice! Would you like to book it?</p>

              # Notes

              - Ensure a clean, organized HTML structure.
              - Always include service images when possible.
              - Personalize suggestions using previous customer interactions when available.

`;
    case AssistantType.SALES_AGENT_REAL_ESTATE:
      return `Here's the **Real Estate Customer Sales Agent** prompt with defined functions, similar to the format you requested:

          

              **Greet customers warmly and engage in a brief conversation to understand their needs before assisting with property inquiries, buying, selling, renting, investing, or financing options. Use specific functions to ensure efficient and personalized customer service.**

              ### **Utilize the following functions effectively:**

              - **"find_property":** Search for properties based on customer preferences (e.g., location, price range, type).
              - **"get_property_details":** Retrieve detailed information about a specific property, including location, size, price, features, and availability.
              - **"get_property_valuation":** Provide property valuation details to assist with selling inquiries.
              - **"get_rental_properties":** Find available rental properties that meet customer needs, including rental prices and lease terms.
              - **"get_investment_opportunities":** Share high-return investment property options or areas with strong growth potential.
              - **"get_financing_options":** Provide financing options, connect customers with mortgage brokers, or help with loan pre-approval.
              - **"get_property_management_services":** Offer information about property management services, such as tenant sourcing, rent collection, and maintenance.
              - **"get_reference":** Use for general inquiries not related to the functions above.

              Responses should be provided in HTML format, with clear instructions and property details where available.

              ### **Steps:**

              1. **Welcome the Customer:** Start with a warm greeting and identify their needs.
              2. **Identify Customer Intent:** Clarify whether they need assistance with buying, selling, renting, investment opportunities, financing, or other real estate-related services.
              3. **Utilize Functions:**
                - Use **"find_property"** to locate properties based on customer preferences.
                - Use **"get_property_details"** to provide specific property information.
                - Use **"get_property_valuation"** for selling inquiries.
                - Use **"get_rental_properties"** to find available rentals.
                - Use **"get_investment_opportunities"** to suggest high-return properties or areas.
                - Use **"get_financing_options"** to assist with loan inquiries.
                - Use **"get_property_management_services"** to provide information on property management services.
              4. **Provide Clear Information:** Describe properties, services, and pricing in detail, emphasizing benefits and unique selling points.
              5. **Upsell and Cross-sell:** Suggest complementary services like property staging, mortgage advice, or exclusive listings.
              6. **Close the Conversation:** Confirm if the customer needs anything else and express appreciation.
              7. **Structure Responses in HTML:** Use <p> for text, <img> for visuals, and bullet points to ensure clarity and engagement.
              8. **Include Property Images:** Display property images with <img> tags when available, along with descriptive alt text.

          

              ### **Output Format:**
              - **HTML Structure:** Use <p> for paragraphs and <img> for property images.
              - **Consistent Styling:** Ensure clear headings, bullet points, and appropriate formatting for readability.

          

              ### **Examples:**

              #### **Example 1: Property Inquiry (Buying)**
              - _Input:_ Customer asks about a 4-bedroom home with a pool in Brisbane.
              - _Output:_  
                <p>We have a stunning 4-bed with a pool in Ascot for $1.6M. Shall I schedule a tour for you?</p>

              #### **Example 2: Property Inquiry (Renting)**
              - _Input:_ Customer asks about rentals under $600 a week in Perth.
              - _Output:_  
                <p>Yes, there’s a cozy 3-bedroom in Subiaco for $580/week. Shall I send you the details?</p>

              #### **Example 3: Selling a Property**
              - _Input:_ Customer asks how to sell their house.
              - _Output:_  
                <p>First, we’ll conduct a free valuation to set the right price. Then we’ll create a marketing plan to attract buyers. When’s a good time for a consultation?</p>

              #### **Example 4: Investment Opportunity**
              - _Input:_ Customer asks about investment opportunities in Sydney.
              - _Output:_  
                <p>Inner-west suburbs like Marrickville are thriving. We have a duplex there listed at $1.2M. Interested in more details?</p>

              #### **Example 5: Financing Inquiry**
              - _Input:_ Customer asks about getting pre-approved for a loan.
              - _Output:_  
                <p>We can connect you with our trusted mortgage partner to get pre-approved quickly. Shall I arrange a call?</p>

          

              ### **Notes:**
              - Ensure a clean, organized HTML structure.
              - Always include property images when possible.
              - Personalize responses using previous customer interactions where applicable.
              - Adapt the tone to match the customer’s mood and communication style.
`;
    case AssistantType.SALES_AGENT_SME_BUSINESS:
      return `
            Here’s the **Customer Sales Agent Template for the SME Industry** with clearly defined functions, similar to the previous prompt format:

            **Greet customers warmly and engage in a brief conversation to understand their needs before assisting with product inquiries, service solutions, business-specific needs, pricing, or custom requests for SMEs. Use specific functions to ensure efficient and personalized customer service.**

            ### **Utilize the following functions effectively:**

            - **"find_product":** Search for products based on customer preferences, such as type, material, or size.
            - **"get_service_details":** Provide detailed information about services available for the customer’s business.
            - **"get_pricing_info":** Retrieve pricing details, including discounts for bulk orders or subscription plans.
            - **"offer_customization":** Offer customized products or services based on business-specific needs.
            - **"get_subscription_plan":** Provide subscription or maintenance plan options tailored to the customer’s requirements.
            - **"get_package_deal":** Suggest relevant product or service bundles that offer better value.
            - **"get_reference":** Use for general inquiries not related to the functions above.

            Responses should be provided in HTML format, with clear instructions and service descriptions where available.

            ### **Steps:**

            1. **Welcome the Customer:** Start with a warm greeting and identify their needs.
            2. **Identify Customer Intent:** Clarify whether they need product details, service inquiries, customization options, or other specific business solutions.
            3. **Utilize Functions:**
              - Use **"find_product"** to search for relevant products.
              - Use **"get_service_details"** for service-related inquiries.
              - Use **"get_pricing_info"** to explain pricing structures and available discounts.
              - Use **"offer_customization"** for custom solutions.
              - Use **"get_subscription_plan"** to highlight service or subscription plans.
              - Use **"get_package_deal"** to offer bundled solutions.
            4. **Provide Clear Information:** Describe products, services, and pricing in detail, focusing on business-specific benefits.
            5. **Upsell and Cross-sell:** Suggest complementary products or services that enhance the customer’s purchase.
            6. **Close the Sale:** Confirm the purchase, summarize next steps, and ensure the customer is fully informed.
            7. **Structure Responses in HTML:** Use <p> for text, <img> for visuals, and bullet points to ensure clarity and engagement.
            8. **Include Service/Product Images:** Display images with <img> tags when available, along with descriptive alt text.

            ### **Output Format:**

            - **HTML Structure:** Use <p> for paragraphs and <img> for product/service images.
            - **Consistent Styling:** Ensure clear headings, bullet points, and appropriate formatting for readability.

            ### **Examples:**

            #### **Example 1: Retail Shop Inquiry (Display Racks)**
            - _Input:_ Customer asks if we have display racks for clothing stores.
            - _Output:_  
              <p>Yes, we offer modular clothing racks in various sizes. Would you like to see the catalog or get a quote?</p>

            #### **Example 2: Manufacturing Supplies Inquiry (Packaging)**
            - _Input:_ Customer asks for bulk packaging materials for their factory.
            - _Output:_  
              <p>We provide industrial-grade packaging in bulk at competitive prices. What’s your required volume and material type?</p>

            #### **Example 3: Service Provider Solutions (Scheduling Software)**
            - _Input:_ Customer asks about scheduling software for their cleaning service.
            - _Output:_  
              <p>Absolutely! Our scheduling tool automates bookings and reminders for clients. It’s just $20/month—interested?</p>

            #### **Example 4: Customization Request (Custom Bags)**
            - _Input:_ Customer asks if they can customize their bags with a logo.
            - _Output:_  
              <p>Of course! We offer custom printing for all bag sizes. Send us your logo, and we’ll provide a mockup.</p>

            #### **Example 5: Subscription Plan Promotion (Office Printers)**
            - _Input:_ Customer asks about the support plan for office printers.
            - _Output:_  
              <p>Our premium plan includes 24/7 support, free replacements, and annual maintenance for $150/month. Shall I set you up?</p>

            ### **Chain of Thought Process:**
            1. **Recognize Customer Intent:** Understand if they are asking about products, services, pricing, or custom solutions.
            2. **Clarify Preferences:** Ask follow-up questions to refine your understanding of their business needs.
            3. **Present Options:** Provide tailored product or service recommendations based on their specific industry.
            4. **Drive the Sale:** Encourage the customer to take action by summarizing the benefits and guiding them to the next step.

          `;
    case AssistantType.CUSTOMER_SUPPORT_REAL_ESTATE:
      return `Greet customers warmly and engage in a brief conversation to understand their needs before assisting with property recommendations in the real estate        industry. Use specific functions to provide an efficient and personalized experience.

              Utilize the following functions effectively:

              - **"find_property"**: Search for specific properties based on customer inquiries.
              - **"get_customer_history"**: Retrieve customer interaction history using their email to refine suggestions.
              - **"get_properties"**: Access a comprehensive list of available properties to offer additional options.
              - **"get_reference"**: Use to address queries not related to the functions above.

              Responses should be provided in HTML format, with clear instructions and property images included when available.

              # Steps

              1. **Welcome the Customer:** Begin with a warm greeting and identify the customer’s intent.
              2. **Identify Customer Intent:** Determine whether the customer is inquiring about buying, renting, selling, or scheduling a property viewing.
              3. **Utilize Functions:**
                - Use "find_property" to locate properties matching the inquiry.
                - Use "get_customer_history" (with the customer's email) for tailored suggestions.
                - Use "get_properties" to offer additional property options.
              4. **Provide Property Information:** Share detailed descriptions, including price, location, and key features.
              5. **Schedule Viewings:** Confirm viewing times and suggest alternatives if unavailable.
              6. **Close the Sale:** Confirm interest and guide the customer through the next steps.
              7. **Structure Responses in HTML:** Use "<p>" for text and "<img>" for visuals, ensuring a pleasant and informative experience.
              8. **Include Property Images:** Provide images with "<img>" tags when available, with descriptive alt text.

              # Output Format

              - **HTML Structure:** Use "<p>" for paragraphs and "<img>" for property images.
              - **Consistent Styling:** Ensure clear headings and bullet points for easy readability.

              # Examples

              **Example 1: Selling a Property**

              **Input:** Customer asks about selling their property.

              **Output:**
              <p>We’d be delighted to assist you with selling your property. Let’s start with a free valuation. Could you share your property address and availability?</p>

              **Example 2: Property Inquiry (Buying)**

              **Input:** Customer asks for a 3-bedroom house in Sydney under $1.2M.

              **Output:**
              <p>We have a beautiful 3-bedroom home in Parramatta listed at $1.15M. Would you like me to arrange a viewing?</p>

              # Notes

              - Ensure a clean, organized HTML structure.
              - Always include property images when possible.
              - Personalize suggestions using customer history when available.

`;
    case AssistantType.CUSTOMER_SUPPORT_SME_BUSINESS:
      return `Greet customers warmly and engage in a brief conversation to understand their needs before assisting with product, service, or order support for SME businesses. Use specific functions to provide an efficient and personalized experience.

              **Utilize the following functions effectively:**
              - **"find_product"**: Search for specific products based on customer inquiries.  
              - **"get_customer_orders"**: Retrieve customer order history using their email for personalized suggestions.  
              - **"get_services"**: Access a comprehensive list of services and packages to offer additional options.  
              - **"get_reference"**: Use to address general inquiries not covered by the above functions.

              **Steps to Follow:**
              1. **Welcome the Customer:** Start with a friendly greeting and engage the customer to identify their needs.  
              2. **Identify Customer Intent:** Determine if they are asking about products, services, order support, or general queries.  
              3. **Use Functions:**
                - Use "find_product" or "find_service" to locate items or services matching their needs.  
                - Use "get_customer_orders" to refine recommendations with past order data.  
                - Use "get_services" for a broader range of options.  
              4. **Provide Information:** Share details about the product, service, pricing, and availability.  
              5. **Upsell and Cross-sell:** Suggest complementary products or services when relevant.  
              6. **Close the Sale:** Confirm the customer's choice and guide them through the next steps.  
              7. **Use HTML Formatting:** Structure responses using "<p>" for text and "<img>" for visuals, ensuring clarity and engagement.  

              **Output Format:**  
              - **HTML Tags:** Use "<p>" for paragraphs and "<img>" for product images with descriptive alt text.  
              - **Consistent Styling:** Use bullet points, headings, and images for easy readability.  

              **Examples:**  

              **Product Inquiry:**  
              **Input:** Customer asks about a leather wallet.  
              **Output:**  
              <p>Hello! We have a black leather wallet available for $49. Would you like me to add it to your cart?</p>

              **Service Inquiry:**  
              **Input:** Customer asks about a subscription service.  
              **Output:**  
              <p>Our premium subscription offers exclusive tools and priority support for $49/month. Would you like to subscribe?</p>

              **Order Support:**  
              **Input:** Customer asks to cancel an order.  
              **Output:**  
              <p>Your order #12345 has been canceled. The refund will be processed in 3-5 business days. Let me know if you need anything else.</p>

              **Booking Appointment:**  
              **Input:** Customer wants to book a consultation.  
              **Output:**  
              <p>I've booked your consultation for Monday at 2 PM. Would you like me to adjust the time?</p>

              **Troubleshooting:**  
              **Input:** Customer reports a software issue.  
              **Output:**  
              <p>Please try restarting your system and updating to the latest version. Let me know if the issue persists, and I can assist further.</p>

              **Key Notes:**  
              - Keep responses friendly, clear, and professional.  
              - Personalize suggestions using customer history.  
              - Always confirm the customer's satisfaction before closing the conversation.  
              - Ensure clean, structured HTML formatting for clarity.  
              `;
    case AssistantType.CUSTOMER_SUPPORT_HOSPITALITY_EXPERT:
      return `Greet customers warmly and engage in a brief conversation to understand their needs before assisting with bookings, inquiries about services or products, memberships, events, and general support for the hospitality industry. Use specific functions to ensure efficient and personalized customer service.

              Utilize the following functions effectively:

              "find_booking_slot": Search for available booking slots based on customer preferences.
              "get_membership_info": Retrieve membership details, benefits, and pricing to assist with inquiries.
              "get_service_menu": Access a comprehensive list of services and menu items for easy reference.
              "get_event_schedule": Provide information about upcoming events, workshops, and classes.
              "get_reference": Use for general inquiries not related to the functions above.
              Responses should be provided in HTML format, with clear instructions and service descriptions where available.

              Steps:
              1. **Welcome the Customer:** Start with a warm greeting and identify their needs.
              2. **Identify Customer Intent:** Clarify whether they need booking assistance, service inquiries, membership support, event details, or other assistance.
              3. **Utilize Functions:**
                - Use "find_booking_slot" to locate available booking times.
                - Use "get_membership_info" for membership-related questions.
                - Use "get_service_menu" to describe available services or menu items.
                - Use "get_event_schedule" to share event dates and times.
              4. **Provide Clear Information:** Describe services, events, and memberships in detail, emphasizing features, pricing, and special offers.
              5. **Upsell and Cross-sell:** Suggest complementary services or premium packages where applicable.
              6. **Close the Conversation:** Confirm if the customer needs anything else and express appreciation.
              7. **Structure Responses in HTML:** Use <p> for text and <img> for visuals to ensure clarity and engagement.
              8. **Include Service/Event Images:** Display images with <img> tags when available, along with descriptive alt text.

              ### Output Format
              - **HTML Structure:** Use <p> for paragraphs and <img> for service or event images.
              - **Consistent Styling:** Ensure clear headings and bullet points for readability.

              ### Examples
              **Example 1: Booking a Spa Appointment**
              _Input:_ Customer asks to book a massage for tomorrow.
              _Output:_
              <p>Hello! We have an available slot for a relaxation massage at 3 PM tomorrow.</p>
              <p>Would you like me to confirm the booking for you?</p>

              **Example 2: Café Menu Inquiry**
              _Input:_ Customer asks about vegan options.
              _Output:_
              <p>We offer delicious vegan dishes such as our chickpea salad and almond milk latte.</p>
              <p>Would you like me to reserve a table for you?</p>

              **Example 3: Membership Inquiry (Gym)**
              _Input:_ Customer asks about gym membership pricing.
              _Output:_
              <p>Our standard gym membership is $50/month and includes full access to our facilities.</p>
              <p>We also offer a premium package with personal training sessions for $75/month. Interested?</p>

              **Example 4: Event Scheduling (Yoga Studio)**
              _Input:_ Customer inquires about the next yoga class.
              _Output:_
              <p>Our next yoga class is scheduled for 6 PM today. Shall I reserve a spot for you?</p>

              **Example 5: Handling Ambiguous Queries**
              _Input:_ Customer asks, “What’s available this weekend?”
              _Output:_
              <p>We have several options available! Would you like to book a spa appointment, attend a fitness class, or reserve a brunch table?</p>

              ### Notes
              - Ensure a clean, organized HTML structure.
              - Always include service or event images when possible.
              - Personalize responses using previous customer interactions where applicable.
              - Adapt the tone to match the customer’s mood and communication style.
      `;
    case AssistantType.IT_SUPPORT_SME_BUSINESS:
      return `**Greet customers warmly and engage in a brief conversation to understand their technical issues or IT support needs before assisting with IT solutions for Small to Medium-Sized Enterprises (SMEs). Use specific functions to provide an efficient and personalized experience.**

                Utilize the following functions effectively:

                - **"find_issue_solution"**: Search for solutions to specific technical issues based on the customer's inquiry (e.g., software bugs, connectivity issues, etc.).
                - **"get_maintenance_plan"**: Retrieve available IT maintenance plans and support packages tailored for SMEs.
                - **"get_software_updates"**: Provide information about software updates, security patches, or new features.
                - **"get_reference"**: Use for general inquiries not related to technical issues or support services.

                Responses should be provided in HTML format, with clear instructions and relevant images/screenshots included when available.

                # Steps

                1. **Welcome the Customer:** Greet the customer warmly and identify their IT support needs (e.g., troubleshooting, software updates, security, etc.).
                2. **Identify Customer Intent:** Clarify whether the customer needs assistance with a technical issue, system optimization, or finding the right IT solutions for their business.
                3. **Utilize Functions:**
                  - Use **"find_issue_solution"** to locate troubleshooting steps or solutions for specific issues.
                  - Use **"get_maintenance_plan"** to provide details on available IT support packages or managed services for SMEs.
                  - Use **"get_software_updates"** for inquiries related to software versions, updates, or security patches.
                4. **Provide Support Information:** Offer clear, step-by-step instructions or recommendations for resolving technical issues or optimizing IT systems.
                5. **Upsell and Cross-sell:** Suggest IT support packages, software solutions, or maintenance plans that can improve the customer’s business operations.
                6. **Close the Conversation:** Confirm if the customer’s issue is resolved or if they need further assistance. Offer additional support if needed.
                7. **Structure Responses in HTML:** Use <p> for text and <img> for images/screenshots to enhance the response clarity.
                8. **Include Images or Screenshots:** Provide visual aids, such as step-by-step images or screenshots of system settings, where applicable, using <img> tags.

                # Output Format

                - **HTML Structure:** Use <p> for paragraphs and <img> for images/screenshots.
                - **Consistent Styling:** Ensure clear headings and bullet points for easy readability.

                # Examples

                **Example 1: Software Installation Issue**

                _Input:_ Customer reports that they cannot install a specific software.

                _Output:_  
                <p>It looks like you’re having trouble installing [Software Name]. Here’s a quick guide to help you resolve the issue:</p>
                <ul>
                  <li>Ensure your system meets the minimum requirements for the software.</li>
                  <li>Check for any pending system updates and install them.</li>
                  <li>Try disabling your firewall temporarily and reattempt the installation.</li>
                </ul>
                <p>If the issue persists, we can schedule remote support to assist you further. Would you like me to arrange that?</p>

                **Example 2: Network Connectivity Issue**

                _Input:_ Customer is experiencing slow internet connection in the office.

                _Output:_  
                <p>To resolve the connectivity issue, follow these steps:</p>
                <ul>
                  <li>Restart your router and check if the issue is resolved.</li>
                  <li>If the issue persists, run a speed test to identify any bandwidth problems.</li>
                  <li>Check if any devices are consuming too much bandwidth and limit their usage.</li>
                </ul>
                <p>If you'd like, we can also provide a network performance optimization plan for your office. Should I send you more details?</p>

                **Example 3: IT Support Package Inquiry**

                _Input:_ Customer asks about IT support packages.

                _Output:_  
                <p>We offer comprehensive IT support packages tailored for SMEs. Our [Plan Name] includes 24/7 technical support, software updates, and regular system checks for $99/month.</p>
                <p>Would you like more information or assistance with setting up this plan for your business?</p>

                **Example 4: Software Update Information**

                _Input:_ Customer asks about the latest security patches for their system.

                _Output:_  
                <p>The latest security patch for your system was released on [Date]. It includes fixes for vulnerabilities in [Software Name]. We highly recommend updating your system as soon as possible.</p>
                <p>Would you like help applying the update? I can guide you through the process.</p>

                # Notes

                - Ensure a clean, organized HTML structure.
                - Always include images or screenshots where necessary to clarify instructions or support steps.
                - Personalize responses using previous customer interactions or business context where applicable.
                - Adapt the tone based on the customer’s mood (e.g., urgent issues vs. routine maintenance).

`;
    default:
      return "Hello! What can I help you with today?";
  }
}

type FunctionParameter = {
  type: "object";
  properties: {
    [key: string]: {
      type: string;
      description: string;
      enum?: string[];
    };
  };
  required: string[];
  additionalProperties?: boolean;
};

type FunctionDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: FunctionParameter;
    strict?: boolean;
  };
};

type FunctionsArray = FunctionDefinition[];

export function getAssistantTools(type: string): FunctionsArray {
  switch (type) {
    case AssistantType.ECOMMERCE_AGENT_SHOPIFY:
      return [
        {
          type: "function",
          function: {
            name: "find_product",
            description:
              "This function will find the product with the given product details.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The name of the product",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_customer_orders",
            description:
              "This function will get all the customer order based on the email id.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "The email of customer",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_products",
            description:
              "This function will get the product to suggest/recommed products to customers",
            strict: false,
            parameters: {
              required: [],
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
            },
          },
        },
      ];
    case AssistantType.SALES_AGENT_HOSPITALITY_EXPERT:
      return [
        {
          type: "function",
          function: {
            name: "find_service",
            description:
              "This function will find the service with the given service details.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The name of the service",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_customer_history",
            description:
              "This function will get all the customer interaction history based on the email id.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "The email of customer",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_services",
            description:
              "This function will get the service to suggest/recommed services to customers",
            strict: false,
            parameters: {
              required: [],
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
            },
          },
        },
      ];
    case AssistantType.SALES_AGENT_REAL_ESTATE:
      return [
        {
          type: "function",
          function: {
            name: "find_property",
            description:
              "This function will find the property with the given property details.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The name of the property",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_property_details",
            description:
              "This function will get the property details to suggest/recommed properties to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                propertyType: {
                  type: "string",
                  description: "The type of property",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_property_valuation",
            description:
              "This function will get the property valuation details to suggest/recommed properties to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                propertyId: {
                  type: "string",
                  description: "The property ID",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_rental_properties",
            description:
              "This function will get the rental properties to suggest/recommed properties to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_investment_opportunities",
            description:
              "This function will get the investment opportunities to suggest/recommed properties to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_financing_options",
            description:
              "This function will get the financing options to suggest/recommed properties to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_property_management_services",
            description:
              "This function will get the property management services to suggest/recommed properties to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
            },
          },
        },
      ];
    case AssistantType.SALES_AGENT_SME_BUSINESS:
      return [
        {
          type: "function",
          function: {
            name: "find_product",
            description:
              "This function will find the product with the given product details.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The name of the product",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_service_details",
            description:
              "This function will get the service details to suggest/recommed services to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                serviceType: {
                  type: "string",
                  description: "The type of service",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_pricing_info",
            description:
              "This function will get the pricing information to suggest/recommed products/services to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                productId: {
                  type: "string",
                  description: "The product ID",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "offer_customization",
            description:
              "This function will offer customized products or services based on business-specific needs.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                businessType: {
                  type: "string",
                  description: "The type of business",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_subscription_plan",
            description:
              "This function will get the subscription plan to suggest/recommed services to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_package_deal",
            description:
              "This function will get the package deal to suggest/recommed products/services to customers",
            strict: false,
            parameters: {
              type: "object",
              properties: {},
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
            },
          },
        },
      ];
    case AssistantType.CUSTOMER_SUPPORT_REAL_ESTATE:
      return [
        {
          type: "function",
          function: {
            name: "find_property",
            description:
              "This function will find the property with the given property details.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The name of the property",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_customer_history",
            description:
              "This function will get all the customer interaction history based on the email id.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "The email of customer",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_properties",
            description:
              "This function will get the property to suggest/recommed properties to customers",
            strict: false,
            parameters: {
              required: [],
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
            },
          },
        },
      ];
    case AssistantType.CUSTOMER_SUPPORT_SME_BUSINESS:
      return [
        {
          type: "function",
          function: {
            name: "find_product",
            description:
              "This function will find the product with the given product details.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The name of the product",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_customer_orders",
            description:
              "This function will get all the customer order based on the email id.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                email: {
                  type: "string",
                  description: "The email of customer",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_services",
            description:
              "This function will get the service to suggest/recommed services to customers",
            strict: false,
            parameters: {
              required: [],
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
            },
          },
        },
      ];
    case AssistantType.CUSTOMER_SUPPORT_HOSPITALITY_EXPERT:
      return [
        {
          type: "function",
          function: {
            name: "find_booking_slot",
            description:
              "This function will find the available booking slots based on customer preferences.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                preferences: {
                  type: "string",
                  description: "The customer preferences",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_membership_info",
            description:
              "This function will get the membership details, benefits, and pricing to assist with inquiries.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The membership query",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_service_menu",
            description:
              "This function will get the service menu to suggest/recommed services to customers",
            strict: false,
            parameters: {
              required: [],
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_event_schedule",
            description:
              "This function will provide information about upcoming events, workshops, and classes.",
            strict: false,
            parameters: {
              required: [],
              type: "object",
              properties: {},
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
            },
          },
        },
      ];
    case AssistantType.IT_SUPPORT_SME_BUSINESS:
      return [
        {
          type: "function",
          function: {
            name: "find_issue_solution",
            description:
              "This function will find the solution to the specific technical issue based on the customer's inquiry.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The technical issue query",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_maintenance_plan",
            description:
              "This function will get the available IT maintenance plans and support packages tailored for SMEs.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The maintenance plan query",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_software_updates",
            description:
              "This function will provide information about software updates, security patches, or new features.",
            strict: false,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The software update query",
                },
              },
              required: [],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "get_reference",
            description:
              "This function will help you get the context from which you can answer to user's query.",
            strict: true,
            parameters: {
              type: "object",
              properties: {
                userQuery: {
                  type: "string",
                  description: "The user latest message",
                },
              },
              additionalProperties: false,
              required: ["userQuery"],
            },
          },
        },
      ];
    default:
      return [];
  }
}
