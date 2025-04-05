"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import MoleculeStructure from "../MoleculeStructure/index";

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY; // Replace with your key

const defaultMolecules = ["Aspirin", "Caffeine", "Glucose", "Ethanol", "Butene", "Morphine", "Penicillin"]; // Default set

const TableOne = () => {
  const [searchQuery, setSearchQuery] = useState("");
  interface Molecule {
    moleculeName: string;
    smilesStructure: string;
    molecularWeight: number;
    // categoryUsage: string;
  }
  
  const [molecules, setMolecules] = useState<Molecule[]>([]);

  // Function to fetch data from PubChem
  const fetchMoleculeData = React.useCallback(async (name: string) => {
    try {
      const response = await axios.get(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/MolecularWeight,CanonicalSMILES/JSON`
      );

      if (response.data && response.data.PropertyTable && response.data.PropertyTable.Properties.length > 0) {
        const molecule = response.data.PropertyTable.Properties[0];

        // Fetch AI-generated category
        const categoryUsage = await categorizeMoleculeAI(name);

        return {
          moleculeName: name,
          smilesStructure: molecule.CanonicalSMILES,
          molecularWeight: molecule.MolecularWeight,
          categoryUsage: categoryUsage,
        };
      }
    } catch (error) {
      console.error(`Error fetching ${name}:`, error);
    }
    return null;
  }
  , []);

  // Function to call OpenAI API for categorization
  const categorizeMoleculeAI = async (name: string) => {
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4", // Or use "gpt-3.5-turbo" for cheaper option
          messages: [
            { role: "system", content: "You are a chemistry expert. Given a molecule name, provide a brief category of its common usage." },
            { role: "user", content: `What is the category of ${name}?` },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data.choices[0]?.message?.content || "Unknown";
    } catch (error) {
      console.error("AI categorization error:", error);
      return "Unknown";
    }
  };

  // Effect to load default molecules
  useEffect(() => {
    const loadDefaultMolecules = async () => {
      const moleculeData = await Promise.all(defaultMolecules.map(fetchMoleculeData));
      setMolecules(moleculeData.filter((mol) => mol !== null));
    };

    loadDefaultMolecules();
  }, [fetchMoleculeData]);

  // Search for new molecule when user types
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.length > 1) {
      const newMolecule = await fetchMoleculeData(e.target.value);
      if (newMolecule) {
        setMolecules([newMolecule]);
      }
    } else {
      // Reset to default molecules
      const moleculeData = await Promise.all(defaultMolecules.map(fetchMoleculeData));
      setMolecules(moleculeData.filter((mol) => mol !== null));
    }
  };

  return (
    <div className="rounded-lg border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-[#181818] dark:bg-[#181818] sm:px-7.5 xl:pb-1">
      <h4 className="mb-6 text-xl font-semibold text-black dark:text-white">Molecules</h4>

      <input
        type="search"
        placeholder="Search molecule"
        value={searchQuery}
        onChange={handleSearch}
        className="border-gray-300 text-gray-700 placeholder-gray-400 dark:border-gray-600 dark:placeholder-gray-500 text-md mb-4 w-full rounded-lg border bg-white px-4 py-3 shadow-sm outline-none focus:border-primary focus:ring-primary dark:bg-[#181818] dark:text-white"
      />

      <div className="flex flex-col">
        <div className="grid grid-cols-3 rounded-lg bg-gray-2 dark:bg-[#121212] sm:grid-cols-4">
          <div className="p-2.5 xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Molecule Name</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Smile Structure</h5>
          </div>
          <div className="p-2.5 text-center xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Molecular Weight (g/mol)</h5>
          </div>
          {/* <div className="hidden p-2.5 text-center sm:block xl:p-5">
            <h5 className="text-sm font-medium uppercase xsm:text-base">Category Usage</h5>
          </div> */}
        </div>

        {molecules.map((molecule, key) => (
          <div
            className={`grid grid-cols-3 sm:grid-cols-4 ${
              key === molecules.length - 1 ? "" : "border-b border-stroke dark:border-strokedark"
            }`}
            key={key}
          >
            <div className="flex items-center justify-center p-2.5 xl:p-5">
              <p className="text-black dark:text-white">{molecule.moleculeName}</p>
            </div>

            <div className="flex items-center gap-3 p-2.5 xl:p-5">
              <MoleculeStructure id={`${key}`} structure={molecule.smilesStructure} />
            </div>

            <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{molecule.molecularWeight}</p>
            </div>

            {/* <div className="hidden items-center justify-center p-2.5 sm:flex xl:p-5">
              <p className="text-black dark:text-white">{molecule.categoryUsage}</p>
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableOne;
