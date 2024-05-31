package org.oscwii.shop.controllers;

import org.oscwii.api.Package;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Controller
public class PageController extends BaseController
{
    @GetMapping("/landing")
    public String landing()
    {
        return "landing";
    }

    @GetMapping("/home")
    public String home()
    {
        return "home";
    }

    @GetMapping("/browse")
    public String browse(@RequestParam(required = false, defaultValue = "games") String category, Model model)
    {
        model.addAttribute("category", category);
        return "browse";
    }

    @GetMapping("/search")
    public String search(@RequestParam(required = false) String query, @RequestParam String type,
                         @RequestParam String category, Model model)
    {
        model.addAttribute("category", category);

        if(type.equals("publishers"))
        {
            if(query == null)
                return listPublishers(model, category);
            else
                return publisherSearch(model, category, query);
        }

        List<Package> packages = api.filterPackages(category, query);
        model.addAttribute("packages", packages);
        return "catalog";
    }

    private String listPublishers(Model model, String category)
    {
        Map<String, Integer> publishers = new TreeMap<>();
        List<Package> packages = api.filterPackages(category, null);

        List<String> authors = packages.stream()
            .map(Package::author)
            .toList();
        publishers.putAll(authors.stream()
            .distinct()
            .collect(Collectors.toMap(
                Function.identity(),
                publisher -> Collections.frequency(authors, publisher)
            )));
        model.addAttribute("publishers", publishers);
        return "publishers";
    }

    private String publisherSearch(Model model, String category, String query)
    {
        List<Package> packages = api.filterPackages(category, null)
            .stream()
            .filter(pkg -> pkg.author().equalsIgnoreCase(query))
            .sorted(Comparator.comparing(Package::author))
            .toList();
        model.addAttribute("packages", packages);
        return "catalog";
    }
}
