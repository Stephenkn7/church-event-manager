import React from 'react';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import { useMembers } from '../context/MemberContext';

const ExportButton = ({ service }) => {
    const { members } = useMembers();

    const handleExport = () => {
        if (!service || !service.parts) return;

        // 1. Préparer les données
        const rows = [];
        let currentMinutes = 0;

        // Entête du fichier avec les infos globales
        rows.push(["PROGRAMME DU CULTE"]);
        rows.push([`THEME: ${service.theme}`]);
        rows.push([`DATE: ${new Date(service.date).toLocaleDateString('fr-FR')}`]);
        rows.push([`DEBUT: ${service.startTime}`]);
        rows.push([]); // Ligne vide

        // En-têtes du tableau
        rows.push(["HORAIRE", "ACTIVITÉ", "INTERVENANT", "FONCTION", "CONTACT", "DURÉE (min)"]);

        // Parser l'heure de début
        const [startH, startM] = service.startTime.split(':').map(Number);

        service.parts.forEach(part => {
            // Calcul de l'horaire
            const date = new Date();
            date.setHours(startH, startM + currentMinutes, 0);
            const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'H');

            // Calcul de l'heure de fin pour cette partie
            const duration = parseInt(part.duration) || 0;
            const endDate = new Date();
            endDate.setHours(startH, startM + currentMinutes + duration, 0);
            const endTimeString = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', 'H');

            const timeRange = `${timeString} - ${endTimeString}`;

            // Trouver les infos de l'intervenant
            const member = members.find(m => m.name === part.leader);
            const contact = member ? member.phone : '';
            const func = member ? member.function : '';

            rows.push([
                timeRange,
                part.name,
                part.leader,
                func,
                contact,
                duration
            ]);

            currentMinutes += duration;
        });

        // Ligne de fin/totaux
        rows.push([]);
        const totalHours = Math.floor(currentMinutes / 60);
        const totalMins = currentMinutes % 60;
        rows.push(["DURÉE TOTALE", "", "", "", "", `${totalHours}h ${totalMins}min`]);

        // 2. Créer le workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(rows);

        // Ajuster la largeur des colonnes
        const wscols = [
            { wch: 20 }, // Horaire
            { wch: 40 }, // Activité
            { wch: 25 }, // Intervenant
            { wch: 15 }, // Fonction
            { wch: 20 }, // Contact
            { wch: 12 }, // Durée
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Programme");

        // 3. Générer le fichier
        const fileName = `Programme_${service.date}_${service.theme.substring(0, 20)}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    return (
        <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition shadow-sm"
            title="Télécharger le programme Excel"
        >
            <Download className="w-4 h-4 mr-2" />
            Excel
        </button>
    );
};

export default ExportButton;
