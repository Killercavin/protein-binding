"use client";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Search } from "lucide-react";

// Dynamically import MoleculeStructure to avoid unnecessary client-side loading
const MoleculeStructure = dynamic(() => import("@/components/MoleculeStructure"), { ssr: false });

export default function PubChem() {
  const [compoundName, setCompoundName] = useState("");
  const [compoundData, setCompoundData] = useState<Partial<CompoundData> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCompoundData = async () => {
    setLoading(true);
    setError("");
    setCompoundData(null);

    try {
      const response = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
          compoundName,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") fetchCompoundData();
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
              onChange={(e) => setCompoundName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-gray-300 p-3 pl-10 text-lg shadow-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a compound name"
            />
            <span className="absolute inset-y-0 right-3 flex items-center">
              <Search className="text-gray-500" />
            </span>
          </div>
        </div>

        {error && <p className="text-red-600 mt-4">{error}</p>}
        {loading && <p className="mt-4">Loading...</p>}

        {compoundData && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
            <h2 className="mb-4 text-xl text-black dark:text-white">Compound Details</h2>
            <p><strong>Molecular Formula:</strong> {compoundData.MolecularFormula}</p>
            <p><strong>Molecular Weight:</strong> {compoundData.MolecularWeight} g/mol</p>
            <p><strong>IUPAC Name:</strong> {compoundData.IUPACName}</p>
            {compoundData.CanonicalSMILES && (
              <div className="mt-4">
                <strong>Structure:</strong>
                <MoleculeStructure id={compoundData.CanonicalSMILES} structure={compoundData.CanonicalSMILES} />
              </div>
            )}
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
