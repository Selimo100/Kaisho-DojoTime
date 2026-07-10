import React from 'react';

type Tone = 'blue' | 'green' | 'purple' | 'gray' | 'red';

const tones: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  red: 'bg-red-50 text-red-700 border-red-200',
};

export default function Badge({
  tone = 'gray',
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
