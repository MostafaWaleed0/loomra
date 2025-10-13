'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Target, User } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { UserSetupData } from './lib/types';

interface SetupScreenProps {
  onComplete: () => void;
  saveUserData: (data: UserSetupData) => Promise<{
    success: boolean;
  }>;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to Goals Tracker',
    subtitle: 'Your journey to productivity starts here',
    icon: Sparkles
  },
  {
    id: 'name',
    title: "What's your name?",
    subtitle: "We'll use this to personalize your experience",
    icon: User
  },
  {
    id: 'password',
    title: 'Create a password',
    subtitle: 'Secure your account with a strong password',
    icon: Target
  },
  {
    id: 'complete',
    title: "You're all set!",
    subtitle: "'Let's start tracking your goals",
    icon: CheckCircle2
  }
];

export function SetupScreen({ onComplete, saveUserData }: SetupScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  const { theme, setTheme } = useTheme();

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        newErrors.name = 'Please enter your name';
      } else if (trimmedName.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      } else if (trimmedName.length > 50) {
        newErrors.name = 'Name must be less than 50 characters';
      }
    }

    if (currentStep === 2) {
      if (!password) {
        newErrors.password = 'Please enter a password';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (password.length > 50) {
        newErrors.password = 'Password must be less than 50 characters';
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      setDirection(1);
      setCurrentStep(1);
      return;
    }

    if (!validateStep()) return;

    setDirection(1);
    if (currentStep === steps.length - 2) {
      setCurrentStep(steps.length - 1);
      setIsSaving(true);

      // Save to database
      const result = await saveUserData({
        name: name.trim(),
        password: password
      });

      if (result.success) {
        setTimeout(() => {
          setIsSaving(false);
          onComplete();
        }, 1500);
      } else {
        // Handle error
        setIsSaving(false);
        setErrors({ save: 'Failed to save data. Please try again.' });
        setCurrentStep(currentStep - 1);
      }
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0 && currentStep < steps.length - 1) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
      setErrors({});
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentStep !== 0) {
      handleNext();
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Progress Bar */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1 bg-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </motion.div>

      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        <motion.div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-primary/5 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-2xl px-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: 'spring', stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="flex flex-col items-center gap-8"
          >
            {/* Icon */}
            <motion.div
              className="relative"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            >
              <div className="p-8 bg-primary/10 rounded-full backdrop-blur-sm">
                <Icon className="size-16 text-primary" strokeWidth={2} />
              </div>
              <motion.div
                className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1.2], opacity: [0, 0.6, 0.3] }}
                transition={{
                  duration: 1.2,
                  delay: 0.3,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              />
            </motion.div>

            {/* Text */}
            <motion.div
              className="text-center space-y-3 max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h1 className="text-4xl font-bold">{step.title}</h1>
              <p className="text-lg text-muted-foreground">{step.subtitle}</p>
            </motion.div>

            {/* Form Content */}
            <motion.div
              className="w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors({});
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="John Doe"
                      className="w-full px-6 py-4 bg-background border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg"
                      autoFocus
                      maxLength={50}
                    />
                    <AnimatePresence>
                      {errors.name && (
                        <motion.p
                          className="text-sm text-destructive px-2"
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors.name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrors({});
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter a strong password"
                      className="w-full px-6 py-4 bg-background border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg"
                      autoFocus
                      maxLength={50}
                    />
                    <AnimatePresence>
                      {errors.password && (
                        <motion.p
                          className="text-sm text-destructive px-2"
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors.password}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors({});
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="Confirm your password"
                      className="w-full px-6 py-4 bg-background border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-lg"
                      maxLength={50}
                    />
                    <AnimatePresence>
                      {errors.confirmPassword && (
                        <motion.p
                          className="text-sm text-destructive px-2"
                          initial={{ opacity: 0, y: -10, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -10, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {errors.confirmPassword}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Theme Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-muted-foreground">Choose your theme</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['light', 'dark', 'system'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTheme(t)}
                          className={`px-4 py-3 rounded-lg border-2 transition-all capitalize ${
                            theme === t ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:border-primary/50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Buttons */}
            <motion.div
              className="flex gap-3 w-full max-w-md"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              {currentStep > 0 && currentStep < steps.length - 1 && (
                <motion.button
                  onClick={handleBack}
                  className="px-6 py-4 bg-muted text-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <ArrowLeft className="size-5" />
                  Back
                </motion.button>
              )}

              {currentStep < steps.length - 1 && (
                <motion.button
                  onClick={handleNext}
                  disabled={isSaving}
                  className="flex-1 px-6 py-4 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={!isSaving ? { scale: 1.02 } : {}}
                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                >
                  {isSaving ? (
                    <>
                      <motion.div
                        className="size-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      {currentStep === 0 ? "Let's Begin" : 'Continue'}
                      <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </motion.button>
              )}
            </motion.div>

            {/* Step Indicator */}
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <motion.div className="flex gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                {steps.slice(1, -1).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index + 1 === currentStep
                        ? 'w-8 bg-primary'
                        : index + 1 < currentStep
                        ? 'w-2 bg-primary/50'
                        : 'w-2 bg-muted'
                    }`}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
