"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

// Define the CompoundData interface
interface CompoundData {
  MolecularFormula: string;
  MolecularWeight: number;
  CanonicalSMILES: string;
  IUPACName: string;
}

// Default compounds to display
const DEFAULT_COMPOUNDS = [
  "caffeine",
  "aspirin",
  "glucose",
  "acetaminophen",
  "ethanol",
  "morphine",
  "serotonin",
  "testosterone",
  "cholesterol",
  "vitamin C",
  "vitamin D",
  "vitamin E",
  "vitamin A",
  "folic acid",
  "curcumin",
  "resveratrol",
  "quercetin",
  "dopamine",
  "norepinephrine",
  "epinephrine",
  "histamine",
  "glutathione",
  "carnitine",
  "creatine",
  "anandamide"
];


// Dynamically import MoleculeStructure to avoid unnecessary client-side loading
const MoleculeStructure = dynamic(() => import("@/components/MoleculeStructure"), { ssr: false });

export default function PubChem() {
  const [compoundName, setCompoundName] = useState("");
  const [compoundData, setCompoundData] = useState<Partial<CompoundData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [featuredCompounds, setFeaturedCompounds] = useState<Array<Partial<CompoundData> & { name: string }>>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Load featured compounds on component mount
    const loadFeaturedCompounds = async () => {
      setLoading(true);
      const compounds = [];
      
      for (const compound of DEFAULT_COMPOUNDS.slice(0, 3)) { // Limit to 3 to avoid too many requests
        try {
          const response = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
              compound
            )}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`
          );

          if (response.ok) {
            const data = await response.json();
            if (data?.PropertyTable?.Properties?.length > 0) {
              const { MolecularFormula, MolecularWeight, CanonicalSMILES, IUPACName } = data.PropertyTable.Properties[0];
              compounds.push({ 
                name: compound, 
                MolecularFormula, 
                MolecularWeight, 
                CanonicalSMILES, 
                IUPACName 
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching ${compound}:`, err);
        }
      }
      
      setFeaturedCompounds(compounds);
      setLoading(false);
    };

    loadFeaturedCompounds();
  }, []);

  const fetchCompoundData = async () => {
    if (!compoundName.trim()) return;
    
    setLoading(true);
    setError("");
    setCompoundData(null);

    try {
      const response = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
          compoundName
        )}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IUPACName/JSON`
      );

      if (!response.ok) throw new Error("Compound not found");

      const data = await response.json();
      if (data?.PropertyTable?.Properties?.length > 0) {
        const { MolecularFormula, MolecularWeight, CanonicalSMILES, IUPACName } = data.PropertyTable.Properties[0];

        setCompoundData({ MolecularFormula, MolecularWeight, CanonicalSMILES, IUPACName });
      } else {
        throw new Error("No data available");
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/autocomplete/compound/${encodeURIComponent(query)}/JSON?limit=5`);
      if (!response.ok) throw new Error("Suggestion fetch failed");

      const data = await response.json();
      if (data?.dictionary_terms?.compound) {
        setSuggestions(data.dictionary_terms.compound);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") fetchCompoundData();
  };

  const handleFeaturedCompoundClick = (compound: string) => {
    setCompoundName(compound);
    // Find if we already have this compound data
    const existingData = featuredCompounds.find(c => c.name.toLowerCase() === compound.toLowerCase());
    if (existingData) {
      // Use existing data
      const { MolecularFormula, MolecularWeight, CanonicalSMILES, IUPACName } = existingData;
      setCompoundData({ MolecularFormula, MolecularWeight, CanonicalSMILES, IUPACName });
      setError("");
    } else {
      // Fetch new data
      fetchCompoundData();
    }
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto p-4">
        <div className="mb-6 flex flex-col items-center md:flex-row md:justify-between">
          <h2 className="text-title-md2 font-semibold text-black dark:text-white">Compound Search</h2>
          <div className="relative mt-4 w-full md:w-96">
            <input
              type="text"
              value={compoundName}
              onChange={(e) => {
                const value = e.target.value;
                setCompoundName(value);

                if (typingTimeout) clearTimeout(typingTimeout);

                setTypingTimeout(setTimeout(() => {
                  fetchSuggestions(value);
                }, 500)); // Debounce: 500ms
              }}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-gray-300 p-3 pl-4 pr-10 text-lg shadow-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a compound name"
            />
            <button 
              onClick={fetchCompoundData}
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer"
            >
              <Search className="text-gray-500" />
            </button>

            {/* Suggestions List */}
            {suggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-300 bg-white shadow-lg dark:bg-gray-900">
                {suggestions.map((suggestion) => (
                  <li
                    key={suggestion}
                    onClick={() => {
                      setCompoundName(suggestion);
                      setSuggestions([]);
                      handleFeaturedCompoundClick(suggestion); // or fetchCompoundData()
                    }}
                    className="cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Featured Compounds */}
        <div className="mb-8">
          <h3 className="mb-3 text-lg font-medium text-black dark:text-white">Popular Compounds:</h3>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_COMPOUNDS.map((compound) => (
              <button
                key={compound}
                onClick={() => handleFeaturedCompoundClick(compound)}
                className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
              >
                {compound}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="mt-4 text-red-600">{error}</p>}
        {loading && <p className="mt-4">Loading...</p>}

        {/* Featured Compounds Gallery */}
        {featuredCompounds.length > 0 && !compoundData && !loading && (
          <div className="mt-8">
            <h3 className="mb-4 text-xl font-medium text-black dark:text-white">Featured Compounds</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredCompounds.map((compound) => (
                <div 
                  key={compound.name}
                  className="cursor-pointer rounded-lg bg-white p-4 shadow-md transition hover:shadow-lg dark:bg-gray-800"
                  onClick={() => handleFeaturedCompoundClick(compound.name)}
                >
                  <h4 className="mb-2 text-lg font-medium capitalize text-black dark:text-white">{compound.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{compound.MolecularFormula}</p>
                  {compound.CanonicalSMILES && (
                    <div className="mt-3 h-24">
                      <MoleculeStructure id={compound.name} structure={compound.CanonicalSMILES} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Compound Details */}
        {compoundData && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl font-medium capitalize text-black dark:text-white">
              {compoundName} Details
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p><strong>Molecular Formula:</strong> {compoundData.MolecularFormula}</p>
                <p><strong>Molecular Weight:</strong> {compoundData.MolecularWeight} g/mol</p>
                <p className="mt-2"><strong>IUPAC Name:</strong> <span className="text-sm">{compoundData.IUPACName}</span></p>
                <p className="mt-2"><strong>SMILES:</strong> <span className="text-sm break-all">{compoundData.CanonicalSMILES}</span></p>
              </div>
              {compoundData.CanonicalSMILES && (
                <div className="h-64">
                  <strong>Structure:</strong>
                  <MoleculeStructure id={compoundName} structure={compoundData.CanonicalSMILES} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
