# Artifex AI - Professional Landing Page

## Project Overview
Create a sophisticated, professional landing page for **Artifex AI**, an advanced AI-powered image generation platform. The page should convey innovation, reliability, and cutting-edge AI technology through clean design and subtle animations.

## Brand Identity
- **Name**: Artifex AI
- **Tagline**: "Transform Ideas into Visual Reality"
- **Industry**: AI Image Generation & Creative Tools
- **Target Audience**: Designers, Artists, Content Creators, Businesses

## Design Requirements

### Theme & Visual Style
- **Color Scheme**: Monochromatic black and white with subtle gray accents
- **Primary**: `#000000` (Pure Black)
- **Secondary**: `#FFFFFF` (Pure White) 
- **Accent**: `#404040` (Dark Gray)
- **Muted**: `#808080` (Medium Gray)
- **Design Philosophy**: Minimalist, Clean, Professional, Modern

### Typography
- Use system fonts or clean sans-serif (Inter, Helvetica, or similar)
- Establish clear hierarchy with font weights and sizes
- Maintain excellent readability and contrast

### Animation Style
- **Framer Motion** for all animations
- Subtle, professional animations - NO flashy or distracting effects
- Focus on:
  - Gentle fade-ins on scroll
  - Smooth hover transitions
  - Elegant parallax effects
  - Micro-interactions on buttons
  - Progressive element reveals

## Technical Stack
- **Framework**: Next.js 15.5.3 with TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui (New York style)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: Clerk (already integrated)

## Page Structure & Sections

### 1. Hero Section
- **Compelling headline**: "Transform Ideas into Visual Reality with AI"
- **Subheading**: Brief description of Artifex AI capabilities
- **Primary CTA**: "Start Creating" (links to sign-up)
- **Secondary CTA**: "View Gallery" (links to examples)
- **Visual**: Clean geometric background or abstract AI-generated imagery placeholder
- **Animation**: Gentle text fade-in, subtle background movement

### 2. Features Section
- **Title**: "Powerful AI Image Generation"
- **3-4 Key Features**:
  1. **Text-to-Image**: "Describe your vision, watch it come to life"
  2. **Image-to-Image**: "Transform existing images with AI precision"
  3. **Professional Quality**: "High-resolution outputs for any project"
  4. **Lightning Fast**: "Generate images in seconds, not hours"
- **Layout**: Cards with icons, hover effects
- **Animation**: Staggered card reveals on scroll

### 3. How It Works Section
- **Title**: "Three Simple Steps"
- **Steps**:
  1. **Describe** - Enter your creative prompt
  2. **Generate** - Let AI create your vision
  3. **Download** - Get professional-quality results
- **Visual**: Step-by-step flow with connecting lines
- **Animation**: Progressive step reveals with line animations

### 4. Gallery/Examples Section
- **Title**: "See What's Possible"
- **Layout**: Grid of AI-generated image examples (use placeholders)
- **Categories**: Art, Photography, Design, Illustrations
- **Animation**: Smooth hover overlays, masonry-style loading

### 5. Pricing Section (Optional)
- **Title**: "Choose Your Plan"
- **3 Tiers**: Free, Pro, Enterprise
- **Clean card layout with feature comparisons**
- **Animation**: Subtle card hover effects, price highlights

### 6. CTA Section
- **Title**: "Ready to Create Something Amazing?"
- **Button**: "Get Started Free"
- **Subtext**: "No credit card required"
- **Background**: Subtle gradient or pattern

### 7. Footer
- **Company info, links, social media**
- **Privacy Policy, Terms of Service**
- **Contact information**

## Component Requirements

### Use These shadcn/ui Components
- `Button` - For all CTAs and interactions
- `Card` - For feature cards, pricing tiers
- `Badge` - For feature highlights, pricing labels
- `Separator` - For section dividers
- `Avatar` - For testimonials (if included)
- `Sheet` or `Navigation Menu` - For mobile navigation

### Custom Components Needed
- Hero section with animated text
- Feature cards with hover effects
- Step-by-step flow diagram
- Image gallery grid
- Pricing comparison table
- Animated background elements

## Animation Specifications

### Framer Motion Patterns
```typescript
// Example animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}
```

### Animation Triggers
- Use `framer-motion`'s `useInView` hook for scroll-triggered animations
- Implement `whileHover` and `whileTap` for interactive elements
- Add `AnimatePresence` for any conditional content

### Performance Guidelines
- Lazy load images and heavy animations
- Use `will-change` property sparingly
- Optimize for 60fps on all devices
- Reduce motion for users with `prefers-reduced-motion`

## Responsive Design
- **Mobile First**: Start with mobile layout, scale up
- **Breakpoints**: 
  - Mobile: 320px - 768px
  - Tablet: 768px - 1024px  
  - Desktop: 1024px+
- **Navigation**: Hamburger menu on mobile, full nav on desktop
- **Typography**: Responsive font sizes using clamp()

## Content Guidelines

### Tone of Voice
- Professional yet approachable
- Focus on capabilities and benefits
- Avoid technical jargon
- Emphasize creativity and innovation

### Call-to-Actions
- Primary: "Start Creating", "Get Started Free"
- Secondary: "Learn More", "View Examples", "See Pricing"
- Use action-oriented language

### Placeholder Content
- Use Lorem Ipsum sparingly - prefer meaningful placeholder text
- Image placeholders should suggest AI-generated content
- Include realistic feature descriptions

## SEO & Performance
- Semantic HTML structure
- Proper heading hierarchy (h1, h2, h3)
- Alt text for all images
- Meta tags for title and description
- Optimize images (WebP format)
- Lazy loading for below-fold content

## Accessibility
- WCAG 2.1 AA compliance
- Proper color contrast ratios
- Keyboard navigation support
- Screen reader friendly
- Focus indicators for interactive elements
- Reduced motion preferences respected

## File Structure
```
src/
├── app/
│   ├── landing/
│   │   └── page.tsx
├── components/
│   ├── landing/
│   │   ├── hero-section.tsx
│   │   ├── features-section.tsx
│   │   ├── how-it-works.tsx
│   │   ├── gallery-section.tsx
│   │   ├── pricing-section.tsx
│   │   └── cta-section.tsx
│   └── ui/ (existing shadcn components)
└── lib/
    └── animations.ts (animation variants)
```

## Integration Notes
- The landing page should integrate with existing Clerk authentication
- "Get Started" buttons should redirect to sign-up flow
- Maintain consistency with existing app design system
- Consider the landing page as entry point to the main application

## Deliverables
1. Fully responsive landing page component
2. All necessary sub-components
3. Animation definitions and variants
4. Responsive design for all screen sizes
5. Clean, semantic HTML structure
6. Optimized performance and accessibility

## Success Metrics
- Page load time under 2 seconds
- 90+ Lighthouse score
- Mobile-friendly design
- Smooth 60fps animations
- Professional, conversion-focused design

---

**Note**: This landing page represents the first impression of Artifex AI. Prioritize clean design, professional aesthetics, and smooth user experience over flashy effects. The goal is to convey trust, innovation, and capability through thoughtful design and subtle motion.