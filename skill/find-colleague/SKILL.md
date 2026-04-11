---
name: find-colleague
description: "Vyhľadaj kolegu z inovia.sk — kontakt, oddelenie, manažér a tím."
---

Použi nástroje na vyhľadanie kolegu alebo zobrazenie tímovej štruktúry.

**Postup podľa otázky:**

- Ak hľadáš konkrétnu osobu podľa mena alebo emailu → zavolaj `find_colleague` s jej menom
- Ak chceš vedieť kto je v oddelení → zavolaj `get_department_members` s názvom oddelenia
- Ak chceš vidieť hierarchiu (manažér / podriadení) → zavolaj `get_org_chart` s emailom osoby
- Kombinuj nástroje podľa potreby (napr. najprv `find_colleague` na zistenie emailu, potom `get_org_chart`)

**Formát odpovede:**

Pre jednu osobu:
- Meno, titul, oddelenie
- Email (klikateľný ak možné)
- Telefón (ak dostupný)
- Manažér a počet priamych podriadených (ak zavolaný `get_org_chart`)

Pre tím / oddelenie:
- Zoznam členov s titulom a emailom
- Celkový počet

Jazyk prispôsob podľa toho, ako píše používateľ.
Tón: priateľský a stručný.
