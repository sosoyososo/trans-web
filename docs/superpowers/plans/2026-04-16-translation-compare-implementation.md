# 翻译对比工具 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个支持 MiniMax/DeepSeek 翻译的左右分列翻译对比工具

**Architecture:** Next.js 14 App Router，前端调用本地 API Routes 代理转发到 MiniMax/DeepSeek，API Key 存储在服务端不暴露给浏览器

**Tech Stack:** Next.js 14, React, Tailwind CSS, shadcn/ui

---

## 文件结构

```
trans-web/
├── app/
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 主页面
│   ├── globals.css             # 全局样式
│   └── api/
│       └── translate/
│           └── route.ts        # 翻译 API Route
├── components/
│   ├── ui/                     # shadcn/ui 组件
│   ├── header.tsx              # 顶部导航栏
│   ├── settings-dialog.tsx     # 设置弹窗
│   ├── translation-panel.tsx   # 翻译面板容器
│   ├── source-pane.tsx         # 原文面板
│   ├── target-pane.tsx         # 译文面板
│   └── segment-block.tsx       # 分段块组件
├── lib/
│   ├── utils.ts                # 工具函数
│   ├── config-store.ts         # localStorage 配置管理
│   └── text-segmenter.ts       # 文本分段算法
├── types/
│   └── index.ts                # 类型定义
└── package.json
```

---

## Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/globals.css`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "trans-web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next": "14.2.20",
    "lucide-react": "^0.400.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-select": "^2.1.2",
    "@radix-ui/react-label": "^2.1.0",
    "@radix-ui/react-slot": "^1.1.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/node": "^20.16.0",
    "@types/react": "^18.3.4",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.10",
    "postcss": "^8.4.41",
    "autoprefixer": "^10.4.20"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

- [ ] **Step 4: 创建 tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 5: 创建 postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
```

- [ ] **Step 6: 创建 app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
  }
}
```

---

## Task 2: 创建类型定义和工具函数

**Files:**
- Create: `types/index.ts`
- Create: `lib/utils.ts`
- Create: `lib/config-store.ts`
- Create: `lib/text-segmenter.ts`

- [ ] **Step 1: 创建 types/index.ts**

```typescript
export type ModelType = "minimax" | "deepseek";

export interface ApiConfig {
  endpoint: string;
  apiKey: string;
  model: ModelType;
}

export interface SegmentSettings {
  minLength: number;
  maxLength: number;
}

export interface TextSegment {
  id: string;
  original: string;
  translated: string;
  status: "pending" | "translating" | "success" | "error";
  error?: string;
}

export interface TranslateRequest {
  text: string;
  model: ModelType;
  endpoint: string;
  apiKey: string;
}

export interface TranslateResponse {
  success: boolean;
  translatedText?: string;
  error?: string;
}
```

- [ ] **Step 2: 创建 lib/utils.ts**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
```

- [ ] **Step 3: 创建 lib/config-store.ts**

```typescript
import { ApiConfig, SegmentSettings, ModelType } from "@/types";

const CONFIG_KEY = "translation-config";
const SETTINGS_KEY = "translation-settings";

const DEFAULT_CONFIG: ApiConfig = {
  endpoint: "",
  apiKey: "",
  model: "minimax" as ModelType,
};

const DEFAULT_SETTINGS: SegmentSettings = {
  minLength: 50,
  maxLength: 500,
};

export function getApiConfig(): ApiConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  const stored = localStorage.getItem(CONFIG_KEY);
  if (!stored) return DEFAULT_CONFIG;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveApiConfig(config: ApiConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function getSegmentSettings(): SegmentSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return DEFAULT_SETTINGS;
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSegmentSettings(settings: SegmentSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
```

- [ ] **Step 4: 创建 lib/text-segmenter.ts**

```typescript
import { TextSegment, SegmentSettings } from "@/types";
import { generateId } from "./utils";

const SENTENCE_DELIMITERS = /[。！？.!?]/;
const CLAUSE_DELIMITERS = /[，、,;；]/;

export function segmentText(
  text: string,
  settings: SegmentSettings
): TextSegment[] {
  if (!text.trim()) return [];

  // Step 1: Split by sentence delimiters
  const rawSegments = text.split(SENTENCE_DELIMITERS).filter((s) => s.trim());

  const result: TextSegment[] = [];

  for (const segment of rawSegments) {
    const trimmed = segment.trim();
    const length = trimmed.length;

    if (length === 0) continue;

    // If segment is within acceptable range, add directly
    if (length >= settings.minLength && length <= settings.maxLength) {
      result.push(createSegment(trimmed));
      continue;
    }

    // If too long, split by clause delimiters
    if (length > settings.maxLength) {
      const subSegments = splitByClauses(trimmed, settings.maxLength);
      for (const sub of subSegments) {
        result.push(createSegment(sub));
      }
      continue;
    }

    // If too short, add to result (will be merged with next during actual translation)
    result.push(createSegment(trimmed));
  }

  // Merge very short segments with the next one
  return mergeShortSegments(result, settings.minLength);
}

function splitByClauses(text: string, maxLength: number): string[] {
  const result: string[] = [];
  let current = "";

  const clauses = text.split(CLAUSE_DELIMITERS);

  for (const clause of clauses) {
    if (current.length + clause.length <= maxLength) {
      current += (current ? "，" : "") + clause;
    } else {
      if (current) result.push(current);
      current = clause;
    }
  }

  if (current) result.push(current);
  return result;
}

function mergeShortSegments(
  segments: TextSegment[],
  minLength: number
): TextSegment[] {
  const result: TextSegment[] = [];
  let buffer = "";

  for (const segment of segments) {
    buffer += (buffer ? "。" : "") + segment.original;

    if (buffer.length >= minLength) {
      result.push(createSegment(buffer));
      buffer = "";
    }
  }

  // Don't forget the last buffer
  if (buffer) {
    result.push(createSegment(buffer));
  }

  return result;
}

function createSegment(text: string): TextSegment {
  return {
    id: generateId(),
    original: text,
    translated: "",
    status: "pending",
  };
}
```

---

## Task 3: 创建 shadcn/ui 基础组件

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/dialog.tsx`
- Create: `components/ui/select.tsx`
- Create: `components/ui/card.tsx`

- [ ] **Step 1: 创建 components/ui/button.tsx**

```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 2: 创建 components/ui/input.tsx**

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 3: 创建 components/ui/label.tsx**

```typescript
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className
    )}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 4: 创建 components/ui/dialog.tsx**

```typescript
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
```

- [ ] **Step 5: 创建 components/ui/select.tsx**

```typescript
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
```

- [ ] **Step 6: 创建 components/ui/card.tsx**

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

---

## Task 4: 创建 API Route

**Files:**
- Create: `app/api/translate/route.ts`

- [ ] **Step 1: 创建 app/api/translate/route.ts**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { TranslateRequest, TranslateResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: TranslateRequest = await request.json();
    const { text, model, endpoint, apiKey } = body;

    if (!text || !model || !endpoint || !apiKey) {
      return NextResponse.json<TranslateResponse>(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build request based on model type
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    let requestBody: Record<string, unknown>;

    if (model === "minimax") {
      requestBody = {
        model: "MiniMax-Text-01",
        messages: [
          {
            role: "user",
            content: `Translate the following text to Chinese: \n\n${text}`,
          },
        ],
      };
    } else {
      // deepseek
      requestBody = {
        model: "deepseek-chat",
        messages: [
          {
            role: "user",
            content: `Translate the following text to Chinese: \n\n${text}`,
          },
        ],
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json<TranslateResponse>(
        { success: false, error: `API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract translated text (common pattern for both APIs)
    const translatedText =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      data.output ||
      "";

    return NextResponse.json<TranslateResponse>({
      success: true,
      translatedText: translatedText.trim(),
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json<TranslateResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Translation failed",
      },
      { status: 500 }
    );
  }
}
```

---

## Task 5: 创建核心组件

**Files:**
- Create: `components/header.tsx`
- Create: `components/settings-dialog.tsx`
- Create: `components/segment-block.tsx`
- Create: `components/source-pane.tsx`
- Create: `components/target-pane.tsx`
- Create: `components/translation-panel.tsx`

- [ ] **Step 1: 创建 components/header.tsx**

```typescript
"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ModelType } from "@/types";

interface HeaderProps {
  model: ModelType;
  onModelChange: (model: ModelType) => void;
  onSettingsClick: () => void;
}

export function Header({
  model,
  onModelChange,
  onSettingsClick,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <Button variant="ghost" size="icon" onClick={onSettingsClick}>
        <Settings className="h-5 w-5" />
        <span className="sr-only">Settings</span>
      </Button>

      <Select value={model} onValueChange={(v) => onModelChange(v as ModelType)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="minimax">MiniMax</SelectItem>
          <SelectItem value="deepseek">DeepSeek</SelectItem>
        </SelectContent>
      </Select>
    </header>
  );
}
```

- [ ] **Step 2: 创建 components/settings-dialog.tsx**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiConfig, ModelType } from "@/types";
import { getApiConfig, saveApiConfig } from "@/lib/config-store";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ApiConfig;
  onConfigChange: (config: ApiConfig) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  config,
  onConfigChange,
}: SettingsDialogProps) {
  const [endpoint, setEndpoint] = useState(config.endpoint);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [model, setModel] = useState<ModelType>(config.model);

  useEffect(() => {
    if (open) {
      setEndpoint(config.endpoint);
      setApiKey(config.apiKey);
      setModel(config.model);
    }
  }, [open, config]);

  const handleSave = () => {
    const newConfig: ApiConfig = { endpoint, apiKey, model };
    saveApiConfig(newConfig);
    onConfigChange(newConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
          <DialogDescription>
            Configure your translation API endpoint and credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="endpoint">API Endpoint</Label>
            <Input
              id="endpoint"
              placeholder="https://api.minimax.chat/v1/chat/completions"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={(v) => setModel(v as ModelType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="minimax">MiniMax</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: 创建 components/segment-block.tsx**

```typescript
"use client";

import { AlertCircle, Loader2, Check, RotateCw } from "lucide-react";
import { TextSegment } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SegmentBlockProps {
  segment: TextSegment;
  onRetry?: () => void;
}

export function SegmentBlock({ segment, onRetry }: SegmentBlockProps) {
  const statusStyles = {
    pending: "border-gray-200",
    translating: "border-blue-200 bg-blue-50",
    success: "border-green-200 bg-green-50",
    error: "border-red-200 bg-red-50",
  };

  return (
    <div
      className={cn(
        "rounded-lg border p-3 mb-2 transition-colors",
        statusStyles[segment.status]
      )}
    >
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          {segment.status === "pending" && (
            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
          )}
          {segment.status === "translating" && (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          )}
          {segment.status === "success" && (
            <Check className="w-5 h-5 text-green-500" />
          )}
          {segment.status === "error" && (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-700 mb-1">
            {segment.original}
          </p>
          {segment.translated && (
            <p className="text-sm text-gray-900">{segment.translated}</p>
          )}
          {segment.error && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-red-600">{segment.error}</p>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-auto p-0 text-blue-600 hover:text-blue-800"
                >
                  <RotateCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 创建 components/source-pane.tsx**

```typescript
"use client";

import { TextSegment, SegmentSettings } from "@/types";
import { segmentText } from "@/lib/text-segmenter";
import { SegmentBlock } from "./segment-block";

interface SourcePaneProps {
  text: string;
  segments: TextSegment[];
  onSegmentsChange: (segments: TextSegment[]) => void;
  settings: SegmentSettings;
}

export function SourcePane({
  text,
  segments,
  onSegmentsChange,
  settings,
}: SourcePaneProps) {
  // Auto-segment when text changes
  const handleTextChange = (newText: string) => {
    const newSegments = segmentText(newText, settings);
    onSegmentsChange(newSegments);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h2 className="font-medium text-sm text-gray-600">Original Text</h2>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <textarea
          className="w-full h-full min-h-[200px] p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Paste your text here..."
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
        />
      </div>
      <div className="border-t bg-gray-50 p-3">
        <div className="flex gap-4 text-xs text-gray-500">
          <span>{segments.length} segments</span>
          <span>
            {segments.filter((s) => s.status === "success").length} translated
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 创建 components/target-pane.tsx**

```typescript
"use client";

import { TextSegment } from "@/types";
import { SegmentBlock } from "./segment-block";

interface TargetPaneProps {
  segments: TextSegment[];
  onRetry: (segmentId: string) => void;
}

export function TargetPane({ segments, onRetry }: TargetPaneProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b bg-gray-50">
        <h2 className="font-medium text-sm text-gray-600">Translated Text</h2>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {segments.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Translated text will appear here
          </div>
        ) : (
          <div className="space-y-1">
            {segments.map((segment) => (
              <SegmentBlock
                key={segment.id}
                segment={segment}
                onRetry={() => onRetry(segment.id)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="border-t bg-gray-50 p-3">
        <div className="flex gap-4 text-xs text-gray-500">
          <span>{segments.length} segments</span>
          <span>
            {segments.filter((s) => s.status === "success").length} completed
          </span>
          {segments.some((s) => s.status === "error") && (
            <span className="text-red-500">
              {segments.filter((s) => s.status === "error").length} failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 创建 components/translation-panel.tsx**

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { SourcePane } from "./source-pane";
import { TargetPane } from "./target-pane";
import { TextSegment, ApiConfig, SegmentSettings } from "@/types";
import { TranslateResponse } from "@/types";
import { getSegmentSettings, saveSegmentSettings } from "@/lib/config-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TranslationPanelProps {
  config: ApiConfig;
}

export function TranslationPanel({ config }: TranslationPanelProps) {
  const [text, setText] = useState("");
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [settings, setSettings] = useState<SegmentSettings>({
    minLength: 50,
    maxLength: 500,
  });

  useEffect(() => {
    const savedSettings = getSegmentSettings();
    setSettings(savedSettings);
  }, []);

  const handleTranslate = useCallback(async () => {
    if (!config.endpoint || !config.apiKey) {
      alert("Please configure API settings first");
      return;
    }

    const segmentsToTranslate = segments.filter(
      (s) => s.status === "pending" || s.status === "error"
    );

    for (const segment of segmentsToTranslate) {
      // Mark as translating
      setSegments((prev) =>
        prev.map((s) =>
          s.id === segment.id ? { ...s, status: "translating" as const } : s
        )
      );

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: segment.original,
            model: config.model,
            endpoint: config.endpoint,
            apiKey: config.apiKey,
          }),
        });

        const data: TranslateResponse = await response.json();

        if (data.success && data.translatedText) {
          setSegments((prev) =>
            prev.map((s) =>
              s.id === segment.id
                ? {
                    ...s,
                    status: "success" as const,
                    translated: data.translatedText || "",
                  }
                : s
            )
          );
        } else {
          setSegments((prev) =>
            prev.map((s) =>
              s.id === segment.id
                ? {
                    ...s,
                    status: "error" as const,
                    error: data.error || "Translation failed",
                  }
                : s
            )
          );
        }
      } catch (error) {
        setSegments((prev) =>
          prev.map((s) =>
            s.id === segment.id
              ? {
                  ...s,
                  status: "error" as const,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Network error",
                }
              : s
          )
        );
      }
    }
  }, [segments, config]);

  // Auto-translate when segments change and there are pending segments
  useEffect(() => {
    if (segments.length > 0 && config.endpoint && config.apiKey) {
      const hasPending = segments.some(
        (s) => s.status === "pending" || s.status === "error"
      );
      if (hasPending) {
        handleTranslate();
      }
    }
  }, [segments, config.endpoint, config.apiKey]);

  const handleRetry = useCallback(
    (segmentId: string) => {
      setSegments((prev) =>
        prev.map((s) =>
          s.id === segmentId ? { ...s, status: "pending" as const } : s
        )
      );
    },
    []
  );

  const handleSettingsChange = (
    key: keyof SegmentSettings,
    value: number
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSegmentSettings(newSettings);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 grid grid-cols-2 gap-4 p-4 min-h-0">
        <div className="border rounded-lg overflow-hidden">
          <SourcePane
            text={text}
            segments={segments}
            onSegmentsChange={setSegments}
            settings={settings}
          />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <TargetPane segments={segments} onRetry={handleRetry} />
        </div>
      </div>
      <div className="border-t bg-gray-50 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="minLength" className="text-sm">
              Min chars:
            </Label>
            <Input
              id="minLength"
              type="number"
              className="w-20"
              value={settings.minLength}
              onChange={(e) =>
                handleSettingsChange("minLength", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="maxLength" className="text-sm">
              Max chars:
            </Label>
            <Input
              id="maxLength"
              type="number"
              className="w-20"
              value={settings.maxLength}
              onChange={(e) =>
                handleSettingsChange("maxLength", parseInt(e.target.value) || 0)
              }
            />
          </div>
          <Button onClick={handleTranslate} disabled={segments.length === 0}>
            Translate All
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Task 6: 创建主页面和布局

**Files:**
- Create: `app/layout.tsx`
- Create: `app/page.tsx`

- [ ] **Step 1: 创建 app/layout.tsx**

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Translation Compare",
  description: "Compare original and translated text side by side",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: 创建 app/page.tsx**

```typescript
"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { SettingsDialog } from "@/components/settings-dialog";
import { TranslationPanel } from "@/components/translation-panel";
import { ApiConfig, ModelType } from "@/types";
import { getApiConfig } from "@/lib/config-store";

export default function Home() {
  const [config, setConfig] = useState<ApiConfig>({
    endpoint: "",
    apiKey: "",
    model: "minimax",
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const savedConfig = getApiConfig();
    setConfig(savedConfig);
  }, []);

  const handleModelChange = (model: ModelType) => {
    const newConfig = { ...config, model };
    setConfig(newConfig);
    localStorage.setItem("translation-config", JSON.stringify(newConfig));
  };

  return (
    <div className="flex flex-col h-screen">
      <Header
        model={config.model}
        onModelChange={handleModelChange}
        onSettingsClick={() => setSettingsOpen(true)}
      />
      <main className="flex-1 min-h-0">
        <TranslationPanel config={config} />
      </main>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        onConfigChange={setConfig}
      />
    </div>
  );
}
```

---

## Task 7: 安装依赖并测试

- [ ] **Step 1: 安装依赖**

```bash
cd /Users/karsa/proj/trans-web && npm install
```

- [ ] **Step 2: 启动开发服务器测试**

```bash
npm run dev
```

- [ ] **Step 3: 验证构建**

```bash
npm run build
```

---

## 验证清单

- [ ] 页面可以正常加载
- [ ] 设置弹窗可以打开和保存配置
- [ ] 粘贴文本后自动分段
- [ ] 翻译请求发送到 API Route
- [ ] 翻译结果显示在右侧面板
- [ ] 段落上下对齐
- [ ] 错误处理和重试机制
