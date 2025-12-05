import React, { useMemo } from 'react';
import { cn } from "@heroui/react";

interface InteractiveTextProps {
  text: string;
  onWordClick: (word: string) => void;
  onSentenceClick: (sentence: string) => void;
  className?: string;
}

export default function InteractiveText({ 
  text, 
  onWordClick, 
  onSentenceClick,
  className 
}: InteractiveTextProps) {
  
  // Memoize the parsed structure to avoid expensive re-calculations
  const parsedContent = useMemo(() => {
    if (!text) return [];

    // Simple sentence splitting (can be improved with a library if needed)
    // Matches sentence endings (.!?) followed by space or end of string
    // Keeps the delimiter
    const sentenceRegex = /([^.!?。！？]+[.!?。！？]+(?=\s|$)|[^.!?。！？]+$)/g;
    const sentences = text.match(sentenceRegex) || [text];

    return sentences.map((sentence, sIdx) => {
      // Split into words, keeping whitespace and punctuation
      // This regex matches: words, punctuation, whitespace
      const wordRegex = /([a-zA-Z0-9'-\u4e00-\u9fa5]+)|([^a-zA-Z0-9'-\u4e00-\u9fa5]+)/g;
      const parts = sentence.match(wordRegex) || [sentence];

      return {
        text: sentence.trim(),
        parts: parts.map((part, pIdx) => ({
          text: part,
          isWord: /^[a-zA-Z0-9'-\u4e00-\u9fa5]+$/.test(part),
          id: `${sIdx}-${pIdx}`
        })),
        id: `s-${sIdx}`
      };
    });
  }, [text]);

  return (
    <span className={cn("inline", className)}>
      {parsedContent.map((sentence) => (
        <span
          key={sentence.id}
          className="group/sentence hover:bg-primary/5 rounded-md px-3 py-1.5 transition-colors cursor-pointer inline box-decoration-clone"
          onClick={(e) => {
            e.stopPropagation();
            onSentenceClick(sentence.text);
          }}
          title="Click to read sentence"
        >
          {sentence.parts.map((part) => (
            part.isWord ? (
              <span
                key={part.id}
                className="hover:text-primary hover:font-medium cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onWordClick(part.text);
                }}
                title="Click to read word"
              >
                {part.text}
              </span>
            ) : (
              <span key={part.id}>{part.text}</span>
            )
          ))}
        </span>
      ))}
    </span>
  );
}
