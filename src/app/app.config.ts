import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom, LOCALE_ID } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeEsPE from '@angular/common/locales/es-PE';

registerLocaleData(localeEsPE, 'es-PE');

import { 
  LucideAngularModule, Search, MapPin, User, Lock, PiggyBank, CreditCard, Banknote, 
  Shield, BarChart3, BarChart, RefreshCw, Lightbulb, ChevronRight, ChevronDown, Smartphone, 
  Monitor, Laptop, Award, ShoppingBag, Rocket, Menu, X, Plus, Minus, ChevronLeft, 
  Briefcase, GraduationCap, HandCoins, CheckCircle2, Wifi, ShieldCheck, CalendarClock, 
  Globe, Check, Clock, Zap, Heart, Star, Sparkles, TrendingUp, ArrowRight, Gift, 
  Facebook, Instagram, Linkedin, Youtube, Phone, Home, ArrowLeftRight, Wrench, 
  Settings, Sun, Moon, Bell, LogOut, Mail, Eye, EyeOff, Chrome, AlertCircle,
  Wallet, Send, Info, TrendingDown, List, Landmark, Trash, AlertTriangle, Calendar,
  CheckCircle, ArrowLeft, MessageSquare, BellOff, ArrowDownLeft, ArrowUpRight,
  History, Infinity, FileText, PieChart, Activity, AlertOctagon, XCircle, Trash2,
  MapPinHouse, Percent, Layers, Edit2, Edit3, PlusCircle, Settings2, Download,
  Key, Package, Truck, Users, Building, ShoppingCart, Folder, Box, Building2, Calculator, CalendarDays, IdCard,
  UserPlus, UserCheck, UserX, UserCog, Upload, Filter, RefreshCcw,
  CircleDollarSign, Printer, ScanEye, Receipt, ImagePlus, ImageOff, ExternalLink, ShieldAlert, GripVertical,
  Paperclip, Save, Coins,
  FileBarChart2,
  UserCircle, MailCheck, Camera, Image,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Ban,
  BookOpen,
  CalendarCheck,
  FileX2,
  FileCheck2,
  Fingerprint,
  ShieldPlus,
  Share2,
  CheckSquare,
  MailWarning,
  MailQuestion,
  LoaderCircle,
  CircleDashed,
  PartyPopper,
  Headset,
  Store,
  Handshake,
  Gavel,
  QrCode,
  ClipboardList, Target, Contact, FileBadge2, BarChart2, FileSpreadsheet
} from 'lucide-angular';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: LOCALE_ID, useValue: 'es-PE' },
    provideCharts(withDefaultRegisterables()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ 
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled'
    })),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    importProvidersFrom(
      LucideAngularModule.pick({ 
        Search, MapPin, User, Lock, PiggyBank, Banknote, Shield, BarChart3, BarChart,
        RefreshCw, Lightbulb, ChevronRight, ChevronDown, Smartphone, Monitor, Laptop, 
        Award, ShoppingBag, Rocket, Menu, X, Plus, PlusCircle, Minus, ChevronLeft, Briefcase, 
        GraduationCap, HandCoins, CheckCircle2, Wifi, ShieldCheck, Globe, CalendarClock, 
        Check, Clock, Zap, Heart, Star, Sparkles, TrendingUp, ArrowRight, Gift, 
        Facebook, Instagram, Linkedin, Youtube, Phone, Home, ArrowLeftRight, Wrench, 
        Settings, Sun, Moon, Bell, LogOut, Mail, Eye, EyeOff, Chrome, AlertCircle,
        Send, Info, TrendingDown, List, Landmark, Trash, AlertTriangle, Calendar,
        CheckCircle, ArrowLeft, MessageSquare, BellOff, ArrowDownLeft, ArrowUpRight,
        History, Infinity, FileText, PieChart, Activity, AlertOctagon, XCircle, Trash2, MapPinHouse,
        Percent, Layers, Edit2, Edit3, Settings2, Download,
        Key, Package, Truck, Users, Building, Building2, ShoppingCart, Folder, Box, Calculator, CalendarDays, Wallet, CreditCard, IdCard,
        UserPlus, UserCheck, UserX, UserCog, Upload, Filter, RefreshCcw, CircleDollarSign, Printer,
        ScanEye, Receipt, ImagePlus, ImageOff, ExternalLink, ShieldAlert, GripVertical,
        Paperclip, Save, Coins, FileBarChart2,
        UserCircle, MailCheck, Camera, Image,ArrowUpDown,ArrowUp,ArrowDown,Ban, BookOpen, CalendarCheck, FileX2, FileCheck2, Fingerprint, ShieldPlus, Share2, CheckSquare, MailWarning, MailQuestion, LoaderCircle, CircleDashed, PartyPopper,Headset, Store, Handshake, Gavel, QrCode,
        ClipboardList, Target, Contact, FileBadge2, BarChart2, FileSpreadsheet
      })
    )
  ]
};
