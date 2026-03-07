#!/usr/bin/env python3
"""
Script de vérification de l'audit dans les routes critiques
Scanne tous les fichiers routes pour s'assurer que l'audit est bien implémenté
"""

import os
import re
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from colorama import init, Fore, Style

# Initialiser colorama pour les couleurs dans le terminal
init(autoreset=True)

class AuditChecker:
    def __init__(self, base_path: str = "."):
        self.base_path = Path(base_path)
        self.routes_dir = self.base_path / "app" / "api" / "v1"
        self.audit_service_path = self.base_path / "app" / "services" / "audit.py"
        
        # Routes critiques à vérifier (méthode, pattern, ressource)
        self.critical_routes = [
            # Auth
            {"method": "POST", "pattern": r"@router\.post\([\"']/register", "resource": "user", "action": "CREATE"},
            {"method": "POST", "pattern": r"@router\.post\([\"']/login", "resource": "user", "action": "LOGIN"},
            {"method": "POST", "pattern": r"@router\.post\([\"']/logout", "resource": "user", "action": "LOGOUT"},
            
            # Shops
            {"method": "POST", "pattern": r"@router\.post\([\"']/shops/?[\"']\)", "resource": "shop", "action": "CREATE"},
            {"method": "PUT", "pattern": r"@router\.put\([\"']/shops/{\w+}", "resource": "shop", "action": "UPDATE"},
            {"method": "DELETE", "pattern": r"@router\.delete\([\"']/shops/{\w+}", "resource": "shop", "action": "DELETE"},
            
            # Products
            {"method": "POST", "pattern": r"@router\.post\([\"']/shops/{\w+}/products", "resource": "product", "action": "CREATE"},
            {"method": "PUT", "pattern": r"@router\.put\([\"']/shops/{\w+}/products/{\w+}", "resource": "product", "action": "UPDATE"},
            {"method": "DELETE", "pattern": r"@router\.delete\([\"']/shops/{\w+}/products/{\w+}", "resource": "product", "action": "DELETE"},
            {"method": "PATCH", "pattern": r"@router\.patch\([\"']/shops/{\w+}/products/{\w+}/stock", "resource": "product", "action": "UPDATE"},
            
            # Orders
            {"method": "POST", "pattern": r"@router\.post\([\"']/orders/?[\"']\)", "resource": "order", "action": "CREATE"},
            {"method": "PUT", "pattern": r"@router\.put\([\"']/orders/{\w+}/status", "resource": "order", "action": "UPDATE"},
            {"method": "POST", "pattern": r"@router\.post\([\"']/orders/{\w+}/cancel", "resource": "order", "action": "UPDATE"},
            
            # Admin actions
            {"method": "POST", "pattern": r"@router\.post\([\"']/admin/users/{\w+}/toggle", "resource": "user", "action": "UPDATE"},
            {"method": "DELETE", "pattern": r"@router\.delete\([\"']/admin/users/{\w+}", "resource": "user", "action": "DELETE"},
        ]
        
        self.results = {
            "ok": [],
            "missing_audit": [],
            "missing_request": [],
            "errors": []
        }
    
    def check_audit_service_exists(self) -> bool:
        """Vérifie que le service d'audit existe"""
        return self.audit_service_path.exists()
    
    def extract_function_content(self, content: str, start_line: int) -> str:
        """Extrait le contenu d'une fonction à partir de sa ligne de début"""
        lines = content.split('\n')
        function_lines = []
        indent_level = None
        in_function = False
        
        for i in range(start_line, len(lines)):
            line = lines[i]
            
            if not in_function:
                # Début de la fonction
                if line.strip() and not line.strip().startswith('@'):
                    in_function = True
                    indent_level = len(line) - len(line.lstrip())
                    function_lines.append(line)
            else:
                # Dans la fonction
                current_indent = len(line) - len(line.lstrip()) if line.strip() else indent_level + 4
                
                # Si on rencontre une nouvelle ligne avec moins d'indentation, c'est la fin
                if line.strip() and current_indent <= indent_level:
                    break
                    
                function_lines.append(line)
        
        return '\n'.join(function_lines)
    
    def check_file(self, filepath: Path) -> List[Dict]:
        """Vérifie un fichier pour les routes critiques"""
        findings = []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                lines = content.split('\n')
        except Exception as e:
            self.results["errors"].append(f"Erreur lecture {filepath}: {e}")
            return findings
        
        for route in self.critical_routes:
            for i, line in enumerate(lines):
                if re.search(route["pattern"], line):
                    # Route trouvée
                    function_content = self.extract_function_content(content, i)
                    
                    # Vérifier la présence de request
                    has_request = 'request: Request' in function_content or 'request: Request' in lines[i-1] if i > 0 else False
                    
                    # Vérifier la présence d'audit
                    has_audit = 'AuditService' in function_content and 'log_' in function_content.lower()
                    
                    # Vérifier les logs spécifiques
                    has_specific_log = False
                    if route["action"] == "CREATE":
                        has_specific_log = 'log_create' in function_content
                    elif route["action"] == "UPDATE":
                        has_specific_log = 'log_update' in function_content
                    elif route["action"] == "DELETE":
                        has_specific_log = 'log_delete' in function_content
                    elif route["action"] in ["LOGIN", "LOGOUT"]:
                        has_specific_log = f'log_{route["action"].lower()}' in function_content
                    
                    findings.append({
                        "file": filepath.name,
                        "route": line.strip(),
                        "resource": route["resource"],
                        "action": route["action"],
                        "has_request": has_request,
                        "has_audit": has_audit,
                        "has_specific_log": has_specific_log,
                        "line_number": i + 1
                    })
                    break
        
        return findings
    
    def run(self):
        """Exécute la vérification"""
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"🔍 AUDIT CHECKER - Vérification des routes critiques")
        print(f"{'='*60}{Style.RESET_ALL}\n")
        
        # Vérifier l'existence du service d'audit
        if not self.check_audit_service_exists():
            print(f"{Fore.RED}❌ Service d'audit non trouvé: {self.audit_service_path}{Style.RESET_ALL}")
            return
        
        print(f"{Fore.GREEN}✅ Service d'audit trouvé{Style.RESET_ALL}\n")
        
        # Scanner tous les fichiers Python dans routes
        route_files = list(self.routes_dir.glob("*.py"))
        
        if not route_files:
            print(f"{Fore.RED}❌ Aucun fichier de route trouvé dans {self.routes_dir}{Style.RESET_ALL}")
            return
        
        all_findings = []
        for filepath in route_files:
            findings = self.check_file(filepath)
            all_findings.extend(findings)
        
        # Analyser les résultats
        for finding in all_findings:
            if not finding["has_request"]:
                self.results["missing_request"].append(finding)
            elif not finding["has_audit"] or not finding["has_specific_log"]:
                self.results["missing_audit"].append(finding)
            else:
                self.results["ok"].append(finding)
        
        # Afficher les résultats
        self.print_results()
    
    def print_results(self):
        """Affiche les résultats de façon colorée"""
        
        # Routes OK
        if self.results["ok"]:
            print(f"\n{Fore.GREEN}✅ ROUTES AVEC AUDIT COMPLET ({len(self.results['ok'])}){Style.RESET_ALL}")
            for r in self.results["ok"]:
                print(f"  ✓ {r['file']}:{r['line_number']} - {r['action']} {r['resource']}")
        
        # Routes sans request
        if self.results["missing_request"]:
            print(f"\n{Fore.YELLOW}⚠️ ROUTES SANS PARAMÈTRE REQUEST ({len(self.results['missing_request'])}){Style.RESET_ALL}")
            for r in self.results["missing_request"]:
                print(f"  ⚠️ {r['file']}:{r['line_number']} - {r['route']}")
                print(f"     → Ajoutez 'request: Request' dans les paramètres")
        
        # Routes sans audit
        if self.results["missing_audit"]:
            print(f"\n{Fore.RED}❌ ROUTES SANS AUDIT ({len(self.results['missing_audit'])}){Style.RESET_ALL}")
            for r in self.results["missing_audit"]:
                print(f"  ❌ {r['file']}:{r['line_number']} - {r['action']} {r['resource']}")
                print(f"     → Route: {r['route']}")
                print(f"     → À auditer avec: audit.log_{r['action'].lower()}(...)")
        
        # Erreurs
        if self.results["errors"]:
            print(f"\n{Fore.RED}❌ ERREURS{Style.RESET_ALL}")
            for err in self.results["errors"]:
                print(f"  {err}")
        
        # Résumé
        print(f"\n{Fore.CYAN}{'='*60}")
        print(f"📊 RÉSUMÉ")
        print(f"{'='*60}{Style.RESET_ALL}")
        print(f"✅ Routes avec audit complet : {len(self.results['ok'])}")
        print(f"⚠️  Routes sans paramètre request : {len(self.results['missing_request'])}")
        print(f"❌ Routes sans audit : {len(self.results['missing_audit'])}")
        
        total = len(self.results['ok']) + len(self.results['missing_request']) + len(self.results['missing_audit'])
        score = (len(self.results['ok']) / total * 100) if total > 0 else 0
        print(f"\n📈 Score d'audit: {score:.1f}%")
        
        if score == 100:
            print(f"{Fore.GREEN}🎉 FÉLICITATIONS ! Audit complet !{Style.RESET_ALL}")
        else:
            print(f"{Fore.YELLOW}⚠️  À améliorer{Style.RESET_ALL}")

if __name__ == "__main__":
    # Installer colorama si nécessaire
    try:
        from colorama import init, Fore, Style
    except ImportError:
        print("Installation de colorama...")
        os.system("pip install colorama")
        from colorama import init, Fore, Style
    
    # Exécuter le checker
    checker = AuditChecker()
    checker.run()
    