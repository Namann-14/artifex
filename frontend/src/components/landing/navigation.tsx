"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Menu, X, Sparkles, User } from 'lucide-react'
import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { isSignedIn, user } = useUser()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Pricing', href: '#pricing' },
  ]

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-lg border-b' : 'bg-transparent'
      }`}
    >
      <nav className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <motion.div 
          className="flex items-center space-x-2 text-xl font-bold"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="gradient-text">Artifex AI</span>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          {navItems.map((item, index) => (
            <motion.a
              key={item.label}
              href={item.href}
              className="text-foreground/80 hover:text-foreground transition-colors relative"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              whileHover={{ y: -2 }}
            >
              {item.label}
              <motion.div
                className="absolute bottom-0 left-0 w-full h-0.5 bg-primary origin-left scale-x-0"
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.a>
          ))}
        </div>

        {/* Desktop CTA & Theme Toggle */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          {isSignedIn ? (
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Button className="btn-hero-primary" asChild>
                  <a href="/dashboard">Dashboard</a>
                </Button>
              </motion.div>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </SignInButton>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <SignUpButton mode="modal">
                  <Button className="btn-hero-primary">
                    Start Creating
                  </Button>
                </SignUpButton>
              </motion.div>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 px-0"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <motion.div
        className={`md:hidden bg-background border-t ${isMobileMenuOpen ? 'block' : 'hidden'}`}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: isMobileMenuOpen ? 1 : 0, height: isMobileMenuOpen ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container mx-auto px-6 py-4 space-y-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="block text-foreground/80 hover:text-foreground transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-4 border-t space-y-3">
            {isSignedIn ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserButton 
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-8 w-8",
                      }
                    }}
                  />
                  <span className="text-sm text-foreground/80">
                    {user?.firstName || user?.emailAddresses[0]?.emailAddress}
                  </span>
                </div>
                <Button className="btn-hero-primary" asChild>
                  <a href="/dashboard">Dashboard</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <SignInButton mode="modal">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button className="btn-hero-primary w-full">
                    Start Creating
                  </Button>
                </SignUpButton>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.header>
  )
}