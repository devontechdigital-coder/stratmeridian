"use client";

import { useEffect } from "react";

export default function HeadCodeInjector({ code }) {
  useEffect(() => {
    if (!code?.trim()) return undefined;

    const template = document.createElement("template");
    template.innerHTML = code;

    const addedNodes = [];
    const nodes = Array.from(template.content.childNodes);

    nodes.forEach((node) => {
      let nodeToAppend = node;

      if (node.nodeName.toLowerCase() === "script") {
        const sourceScript = node;
        const script = document.createElement("script");

        Array.from(sourceScript.attributes).forEach((attribute) => {
          script.setAttribute(attribute.name, attribute.value);
        });

        script.text = sourceScript.textContent || "";
        nodeToAppend = script;
      }

      document.head.appendChild(nodeToAppend);
      addedNodes.push(nodeToAppend);
    });

    return () => {
      addedNodes.forEach((node) => {
        if (node.parentNode) node.parentNode.removeChild(node);
      });
    };
  }, [code]);

  return null;
}
