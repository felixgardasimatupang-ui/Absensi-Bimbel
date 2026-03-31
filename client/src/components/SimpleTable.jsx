function SimpleTable({ headers, rows }) {
    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        {headers.map((header) => <th key={header}>{header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, index) => (
                        <tr key={`${row[0]}-${index}`}>
                            {row.map((cell, cellIndex) => <td key={`${headers[cellIndex]}-${index}`}>{cell}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SimpleTable;