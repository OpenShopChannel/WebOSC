package org.oscwii.shop.controllers;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.oscwii.api.Package;
import org.oscwii.shop.utils.Paginator;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import static java.lang.String.CASE_INSENSITIVE_ORDER;

@Controller
public class PageController extends BaseController implements ErrorController
{
    /*private final RTitlesService recommendedTitles;

    @Autowired
    public PageController(RTitlesService recommendedTitles)
    {
        this.recommendedTitles = recommendedTitles;
    }*/

    @GetMapping("/debug")
    public String debug(@CookieValue String language, Model model)
    {
        if(!isDevelopment())
            return "redirect:/";
        model.addAttribute("lang", language);
        return "debug";
    }

    @GetMapping("/error")
    public String handleError(HttpServletRequest request, Model model, @RequestParam(value = "code") Optional<Integer> ecError)
    {
        Object code = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if(code != null)
            if((int) code == 404)
                return "error/404";

        if(ecError.isPresent())
        {
            model.addAttribute("code", ecError.get());
            return "error/ecerror";
        }

        return "error/500";
    }

    @GetMapping("/landing")
    public String landing(Model model)
    {
        model.addAttribute("catalog", catalog)
            .addAttribute("featuredPackage", catalog.getFeaturedApp())
            .addAttribute("newestPackages", catalog.getNewestPackages());
            //.addAttribute("rTitles", recommendedTitles.getPages())
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
                         @RequestParam String category,
                         @RequestParam(defaultValue = "1") int page, Model model)
    {
        model.addAttribute("category", category);
        Comparator<Package> sortingCriteria = Comparator.comparing(Package::name);

        switch(type)
        {
            case "popular":
                sortingCriteria = Comparator.comparing(Package::downloads).reversed();
                break;
            case "newest":
                sortingCriteria = Comparator.comparing(Package::releaseDate).reversed();
                break;
            case "publishers":
                if(query == null)
                    return listPublishers(model, category);
                else
                    return publisherSearch(page, model, category, query);
        }

        List<Package> packages = catalog.filterPackages(category, query)
            .stream()
            .sorted(sortingCriteria)
            .toList();
        Paginator<Package> paginator = new Paginator<>(packages);
        model.addAttribute("packages", paginator.paginate(page))
            .addAttribute("currentPage", page)
            .addAttribute("pages", paginator.getNumberOfPages());
        return "catalog";
    }

    private String listPublishers(Model model, String category)
    {
        Map<String, Integer> publishers = new TreeMap<>(CASE_INSENSITIVE_ORDER);
        List<Package> packages = catalog.filterPackages(category, null);

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

    private String publisherSearch(int page, Model model, String category, String query)
    {
        List<Package> packages = catalog.filterPackages(category, null)
            .stream()
            .filter(pkg -> pkg.author().equalsIgnoreCase(query))
            .sorted(Comparator.comparing(Package::author))
            .toList();
        Paginator<Package> paginator = new Paginator<>(packages);
        model.addAttribute("packages", paginator.paginate(page))
            .addAttribute("currentPage", page)
            .addAttribute("pages", paginator.getNumberOfPages());
        return "catalog";
    }
}
