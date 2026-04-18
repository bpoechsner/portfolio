"use client";

import { useEffect, useRef, useState } from "react";

interface Skill {
  name: string;
  level: number;
}

interface SkillBarsProps {
  skills: Skill[];
  // When provided, each skill name becomes inline-editable.
  // Format: "skills.electrical" → produces paths like "skills.electrical.0.name"
  pathPrefix?: string;
}

export default function SkillBars({ skills, pathPrefix }: SkillBarsProps) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-4">
      {skills.map((skill, i) => (
        <div key={skill.name}>
          <div className="flex justify-between items-baseline mb-1.5">
            <span
              className="font-mono text-[13px] text-neutral-300"
              {...(pathPrefix
                ? {
                    "data-editable": "true",
                    "data-path": `${pathPrefix}.${i}.name`,
                  }
                : {})}
            >
              {skill.name}
            </span>
            <span className="font-mono text-[11px] text-amber-400/80">{skill.level}%</span>
          </div>
          <div className="h-[3px] bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all ease-out"
              style={{
                width: animated ? `${skill.level}%` : "0%",
                transitionDuration: `${700 + i * 80}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
