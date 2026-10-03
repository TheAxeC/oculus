// The sectioning lines of three real LaTeX files, each with the headings the reader must find in
// them: one string per line in file order. Each file as a whole is refused by the parser, and the
// tests append a stray closing brace to the lines, which the parser refuses as well, so each text
// holds only the lines the case reads.

/** The sectioning lines of a funding application main file: 20 headings. */
export const FUNDING = {
    lines: [
        '\\section{Changes to previous project proposal}',
        '\\section{Rationale and positioning with regard to the state-of-the-art}',
        '\\subsection{State-of-the-art}',
        '\\subsubsection{Neuroscience Use Case: finger trajectory decoding from motor ECoG activity}',
        '\\subsubsection{Cardiovascular Use Case: a federated learning approach to Atrial fibrillation prediction}',
        '\\subsection{Rationale}',
        '\\section{Scientific research objectives}',
        '\\section{Research methodology and work plan}',
        '\\section{Gantt chart with milestones}',
        '\\subsection{Gantt plan}',
        '\\subsection{Work package 1: Nonlinear multiway decoder (month 1-36)}',
        '\\subsubsection{Multiway linear regression: achievements and limitations of the BTTR model}',
        '\\subsubsection{Federated Learning Definition}',
        '\\subsubsection{Proposed multiway nonlinear decoder: Federated Block-Term Tensor Regression (FBTTR)}',
        '\\subsection{Work package 2: Neuroscience Use Case (month 6-36)}',
        '\\subsubsection{Work package 2.1: Decoder training on actual movements using avatar (month 6-24)}',
        '\\subsubsection{Work package 2.2: Subject training on imagined movements (month 18-36)}',
        '\\subsection{Work package 3: Cardiovascular Use Case (month 1-36)}',
        '\\subsubsection{Work package 3.1: Model training and validation (month 6-24)}',
        '\\subsubsection{Work package 3.2: Federated setting (month 20-36)}'
    ],
    headings: [
        ['Changes to previous project proposal', 2],
        ['Rationale and positioning with regard to the state-of-the-art', 2],
        ['State-of-the-art', 3],
        ['Neuroscience Use Case: finger trajectory decoding from motor ECoG activity', 4],
        [
            'Cardiovascular Use Case: a federated learning approach to Atrial fibrillation prediction',
            4
        ],
        ['Rationale', 3],
        ['Scientific research objectives', 2],
        ['Research methodology and work plan', 2],
        ['Gantt chart with milestones', 2],
        ['Gantt plan', 3],
        ['Work package 1: Nonlinear multiway decoder (month 1-36)', 3],
        ['Multiway linear regression: achievements and limitations of the BTTR model', 4],
        ['Federated Learning Definition', 4],
        ['Proposed multiway nonlinear decoder: Federated Block-Term Tensor Regression (FBTTR)', 4],
        ['Work package 2: Neuroscience Use Case (month 6-36)', 3],
        ['Work package 2.1: Decoder training on actual movements using avatar (month 6-24)', 4],
        ['Work package 2.2: Subject training on imagined movements (month 18-36)', 4],
        ['Work package 3: Cardiovascular Use Case (month 1-36)', 3],
        ['Work package 3.1: Model training and validation (month 6-24)', 4],
        ['Work package 3.2: Federated setting (month 20-36)', 4]
    ] as [string, number][]
};

/** The sectioning lines of a manuscript main file: 18 headings. */
export const MOTOR = {
    lines: [
        '\\section{Introduction}',
        '\\section{Methods}',
        '\\subsection{Granger Causality}',
        '\\subsection{Information Theory}',
        '\\subsection{Causal Graph Processes}',
        '\\subsection{Temporal Causal Discovery Framework}',
        '\\paragraph{Methods} The Temporal Causal Discovery Framework, an attention-based convolutional neural network with a causal validation step, is used to discover causal relationships \\cite{Nauta_2019}. ',
        '\\subsection{Temporal Causal Graph Process}',
        '\\subsection{Node Selection with the Temporal Causal Discovery Framework}',
        '\\section{Experiments}',
        '\\subsection{Simulation}',
        '\\subsection{Experimental setup}',
        '\\paragraph{Experiments} A functional network was simulated in order to validate the developed method. The simulation assumes several steps: generation of brain sources with a given connectivity pattern, generation of noisy sources, forward modelling of brain and noisy sources using a given signal-to-noise ratio, generation of sensor noise, inverse modelling of resulting signal and connectivity estimation \\cite{anzolin2019quantifying}. The connectivity pattern used was selected from \\cite{5931445}, shown in equation~\\ref{eq1}.',
        '\\section{Results}',
        "\\paragraph{Results} Within the simulation framework, 500 noisy sources were implemented with a signal-to-noise ratio of 0.9. Sensor noise was added with a signal-to-noise ratio of 0.9. As a forward model the 'New York Head Model' was used to map activity from brain sources to the scalp \\cite{huang2016new}. The resulting connectivity estimation is given in equation~\\ref{eq2}. These preliminary results show that the described method can accurately estimate simulated connectivity patterns.",
        '\\section{Discussion}',
        '\\section{Conclusion}',
        '\\section{Acknowledgements}'
    ],
    headings: [
        ['Introduction', 2],
        ['Methods', 2],
        ['Granger Causality', 3],
        ['Information Theory', 3],
        ['Causal Graph Processes', 3],
        ['Temporal Causal Discovery Framework', 3],
        ['Methods', 5],
        ['Temporal Causal Graph Process', 3],
        ['Node Selection with the Temporal Causal Discovery Framework', 3],
        ['Experiments', 2],
        ['Simulation', 3],
        ['Experimental setup', 3],
        ['Experiments', 5],
        ['Results', 2],
        ['Results', 5],
        ['Discussion', 2],
        ['Conclusion', 2],
        ['Acknowledgements', 2]
    ] as [string, number][]
};

/** The sectioning lines of a manuscript appendix: 21 headings. */
export const APPENDIX = {
    lines: [
        '\\section{Simulated EEG Dataset} ',
        '\\subsection{Initialisation}',
        '\\subsection{Methods}',
        '\\subsubsection{LCMV}',
        '\\subsubsection{eLORETA}',
        '\\subsubsection{BC-VARETA}',
        '\\subsubsection{Sparse eLORETA}',
        '\\subsection{Medoid Clustering}',
        '\\section{Imaginary Movement EEG Dataset}',
        '\\subsection{Head Model}',
        '\\subsection{Methods}',
        '\\subsubsection{LCMV}',
        '\\subsubsection{eLORETA}',
        '\\subsubsection{BC-VARETA}',
        '\\subsubsection{Sparse eLORETA}',
        '\\section{Cuban EEG Dataset} ',
        '\\subsection{Methods}',
        '\\subsubsection{LCMV}',
        '\\subsubsection{eLORETA}',
        '\\subsubsection{BC-VARETA}',
        '\\subsubsection{Sparse eLORETA}'
    ],
    headings: [
        ['Simulated EEG Dataset', 2],
        ['Initialisation', 3],
        ['Methods', 3],
        ['LCMV', 4],
        ['eLORETA', 4],
        ['BC-VARETA', 4],
        ['Sparse eLORETA', 4],
        ['Medoid Clustering', 3],
        ['Imaginary Movement EEG Dataset', 2],
        ['Head Model', 3],
        ['Methods', 3],
        ['LCMV', 4],
        ['eLORETA', 4],
        ['BC-VARETA', 4],
        ['Sparse eLORETA', 4],
        ['Cuban EEG Dataset', 2],
        ['Methods', 3],
        ['LCMV', 4],
        ['eLORETA', 4],
        ['BC-VARETA', 4],
        ['Sparse eLORETA', 4]
    ] as [string, number][]
};
