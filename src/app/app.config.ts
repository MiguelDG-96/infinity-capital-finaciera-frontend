import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LucideAngularModule, Search, MapPin, User, Lock, PiggyBank, CreditCard, Banknote, Shield, BarChart3, RefreshCw, Lightbulb, ChevronRight, ChevronDown, Smartphone, Monitor, Laptop, Award, ShoppingBag, Rocket, Menu, X, Plus, Minus, ChevronLeft, Briefcase, GraduationCap, HandCoins, CheckCircle2, Wifi, ShieldCheck, CalendarClock, Globe, Check, Clock, Zap, Heart, Star, Sparkles, TrendingUp, ArrowRight } from 'lucide-angular';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick({ Search, MapPin, User, Lock, PiggyBank, CreditCard, Banknote, Shield, BarChart3, RefreshCw, Lightbulb, ChevronRight, ChevronDown, Smartphone, Monitor, Laptop, Award, ShoppingBag, Rocket, Menu, X, Plus, Minus, ChevronLeft, Briefcase, GraduationCap, HandCoins, CheckCircle2, Wifi, ShieldCheck, Globe, CalendarClock, Check, Clock, Zap, Heart, Star, Sparkles, TrendingUp, ArrowRight }))
  ]
};
