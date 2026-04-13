import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthHeader = () => (
  <>
    {/* 18+ Warning Banner */}
    <div className="bg-destructive/90 text-destructive-foreground py-2.5 px-4 text-center">
      <div className="flex items-center justify-center gap-2 flex-wrap">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="font-semibold text-xs">
          Site réservé aux adultes (+18 ans) • Hommes uniquement
        </span>
        <Link to="/legal" className="underline hover:no-underline text-xs ml-1 opacity-80">
          Mentions légales
        </Link>
      </div>
    </div>

    {/* Logo */}
    <motion.div
      className="text-center pt-8 pb-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="font-display text-3xl font-bold gradient-text">GaySocial</h1>
    </motion.div>
  </>
);

export default AuthHeader;
