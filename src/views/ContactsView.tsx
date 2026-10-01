import React, { useState } from 'react';
import { ContactRecord, Company } from '../types/talentForge';
import { ShieldCheck, Mail, User, Search, ExternalLink, Copy } from 'lucide-react';

interface ContactsViewProps {
  contacts: ContactRecord[];
  companies: Company[];
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  contacts,
  companies,
}) => {
  const [search, setSearch] = useState('');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const companyMap = new Map(companies.map((c) => [c.id, c.name]));

  const filteredContacts = contacts.filter((c) => {
    const compName = companyMap.get(c.companyId) || '';
    return (
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      compName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Policy Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Hunter Contact Enrichment & Verified Business Email Gate</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Strict Non-Negotiable Rule: Final lead qualification requires Hunter-verified professional business emails. Guessed patterns (e.g. firstname.lastname@) are strictly prohibited.
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
            {contacts.filter((c) => c.isVerifiedBusinessEmail).length} Verified Emails
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search contact name, title, company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
        />
      </div>

      {/* Contacts Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Decision Maker</th>
              <th className="py-3 px-4">Verified Title</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Business Email</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4 text-right">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No enriched contacts match your search.
                </td>
              </tr>
            ) : (
              filteredContacts.map((c) => {
                const compName = companyMap.get(c.companyId) || 'Company';
                return (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.fullName}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {c.title}
                    </td>

                    <td className="py-3 px-4 text-blue-400">
                      {compName}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-emerald-400 font-semibold">{c.email}</span>
                        <button
                          onClick={() => copyEmail(c.email)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {copiedEmail === c.email && (
                          <span className="text-[10px] text-emerald-400">Copied!</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-300">
                      {c.hunterConfidence}%
                    </td>

                    <td className="py-3 px-4 text-right">
                      {c.isVerifiedBusinessEmail ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-400 font-bold">
                          UNVERIFIED
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
