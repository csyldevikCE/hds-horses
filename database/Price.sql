SELECT
	p.IdProject,
	p.Caption,
	j.IdJob,
	j.Caption,
	st.Caption
FROM Project p 
	INNER JOIN Job j
		ON p.IdProject = j.IdProject
	INNER JOIN StockType2Job stj
		ON stj.IdJob = j.IdJob
	INNER JOIN StockType st
		ON st.IdStockType = stj.IdStockType
WHERE p.IdProject = 166848
GROUP BY 	p.IdProject,
	p.Caption,
	j.IdJob,
	j.Caption,
	st.Caption
    