import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-accent text-accent-foreground mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Support</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="text-sm">support@ecivote.gov.in</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-sm">1800-XXX-XXXX (Toll-Free)</span>
              </div>
              <p className="text-sm text-accent-foreground/80">Available 24/7 during election period</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/verify" className="text-sm hover:text-primary transition-colors">
                  Verify Your Vote
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="text-lg font-semibold mb-4">About</h3>
            <p className="text-sm text-accent-foreground/80 leading-relaxed">
              Secure online voting platform powered by the Election Commission of India. 
              Enabling democratic participation for NRIs and Armed Forces personnel worldwide.
            </p>
          </div>
        </div>

        <div className="border-t border-accent-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-accent-foreground/70">
            © 2025 Election Commission of India. All rights reserved.
          </p>
          <p className="text-xs text-accent-foreground/60 mt-2">
            Protected by military-grade encryption • Anonymous & Verifiable
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
