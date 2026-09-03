"use client";

import React from "react";
import Markdown from "markdown-to-jsx";

/**
 * Renders one chat message.
 *
 * Assistant replies arrive in two different shapes depending on the assistant
 * type: some prompt templates instruct the model to reply in HTML (the shopify
 * template says "Always reply in HTML format"), while the rest return markdown.
 *
 * Every render site used to inject the reply with dangerouslySetInnerHTML, which
 * renders HTML correctly but shows markdown as literal source - customers saw
 * "**Macronutrient Calculator**" and "[Use the calculator](https://...)" as raw
 * syntax in the chat.
 *
 * markdown-to-jsx handles both: markdown is converted, and inline HTML in the
 * source is parsed rather than escaped, so the HTML-emitting templates keep
 * working unchanged.
 *
 * Raw HTML in the source needs care. Because markdown-to-jsx parses inline HTML
 * rather than escaping it, a <script> in message content becomes a real script
 * element - and unlike a script assigned through innerHTML, which browsers do
 * not execute, one that React creates and appends does run. Message content
 * restates material crawled from customer websites, so the executable and
 * navigational tags are dropped below.
 */

/// Tags that must never be constructed from message content. Rendering nothing
/// is right for all of them: none carry text a customer needs to read, and each
/// either executes (script), loads third-party content (iframe, object, embed),
/// or restyles the host page (style, link).
const DROPPED_TAGS = [
  "script",
  "iframe",
  "object",
  "embed",
  "style",
  "link",
  "meta",
  "base",
  "form",
] as const;

const dropTagOverrides = Object.fromEntries(
  DROPPED_TAGS.map((tag) => [tag, { component: () => null }])
);
export default function MessageContent({
  content,
  className,
  style,
}: {
  content: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className} style={style}>
      <Markdown
        options={{
          /// the surrounding div already carries the message styling; without
          /// this markdown-to-jsx adds another wrapper element and the existing
          /// CSS stops matching
          wrapper: React.Fragment,
          forceWrapper: true,
          overrides: {
            ...dropTagOverrides,
            /// chat lives in a small panel, and in an iframe when embedded on a
            /// customer's site - a link that navigates the widget away from the
            /// conversation loses it
            a: {
              props: {
                target: "_blank",
                rel: "noopener noreferrer",
              },
            },
          },
        }}
      >
        {content ?? ""}
      </Markdown>
    </div>
  );
}
