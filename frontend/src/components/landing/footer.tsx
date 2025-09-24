"use client"

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef } from 'react'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Twitter, 
  Instagram, 
  Github, 
  Mail,
  ArrowUp
} from 'lucide-react'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'API', href: '/api' },
    { label: 'Integrations', href: '/integrations' }
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'Status', href: '/status' },
    { label: 'Community', href: '/community' },
    { label: 'Tutorials', href: '/tutorials' }
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Partners', href: '/partners' }
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'GDPR', href: '/gdpr' },
    { label: 'Licenses', href: '/licenses' }
  ]
}

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/artifex_ai', label: 'Twitter' },
  { icon: Instagram, href: 'https://instagram.com/artifex_ai', label: 'Instagram' },
  { icon: Github, href: 'https://github.com/artifex-ai', label: 'GitHub' },
  { icon: Mail, href: 'mailto:hello@artifex.ai', label: 'Email' }
]

export function Footer() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer ref={ref} className="bg-card border-t">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="py-16"
        >
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
            {/* Brand Column */}
            <motion.div 
              variants={staggerItem}
              className="lg:col-span-2"
            >
              <motion.div 
                className="flex items-center space-x-2 text-xl font-bold mb-4"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Sparkles className="h-6 w-6 text-primary" />
                <span className="gradient-text">Artifex AI</span>
              </motion.div>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Transform your creative ideas into stunning visual reality with professional AI-powered image generation. 
                Trusted by creators worldwide.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="sr-only">{social.label}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Links Columns */}
            <motion.div variants={staggerItem} className="lg:col-span-1">
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3">
                {footerLinks.product.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={staggerItem} className="lg:col-span-1">
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={staggerItem} className="lg:col-span-1">
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div variants={staggerItem} className="lg:col-span-1">
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>

        <Separator />

        {/* Bottom Bar */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="py-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
        >
          <div className="text-sm text-muted-foreground">
            © 2024 Artifex AI. All rights reserved. Built with ❤️ for creators.
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-sm text-muted-foreground">
              Made with Lovable
            </div>
            
            <motion.button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors group"
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="sr-only">Back to top</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}