import { GitHubLogoIcon, LockClosedIcon } from "@radix-ui/react-icons";
import Image, { type StaticImageData } from "next/image";
import { getTranslations } from "next-intl/server";

import { ShowcaseDetailHeader } from "./showcase-detail-header";

interface ShowcaseProjectCollectionProps {
  description: string;
  kicker: string;
  projects: {
    description: string;
    details?: { label: string; value: string }[];
    href?: string;
    label?: string;
    name: string;
    screenshots?: {
      alt: string;
      darkImage?: StaticImageData;
      image: StaticImageData;
      label: string;
    }[];
    wordmark?: StaticImageData;
  }[];
  title: string;
}

export async function ShowcaseProjectCollection({
  description,
  kicker,
  projects,
  title,
}: ShowcaseProjectCollectionProps) {
  const t = await getTranslations();

  return (
    <section className="showcase-page" data-testid="showcase-detail-shell">
      <ShowcaseDetailHeader
        backLabel={t("back")}
        description={description}
        href="/show"
        kicker={kicker}
        navigationLabel={t("showcase.detailNavigationLabel", { title })}
        title={title}
      />

      <ul
        aria-label={t("showcase.projectsLabel")}
        className="divide-y divide-foreground/15 has-[figure]:border-foreground/15 has-[figure]:border-b"
      >
        {projects.map((project) => {
          const projectName = project.wordmark ? (
            <Image
              alt={project.name}
              className="h-8 w-36 max-w-full object-contain object-left brightness-0 dark:invert"
              sizes="144px"
              src={project.wordmark}
            />
          ) : (
            project.name
          );
          const projectBadge = (
            <span
              aria-hidden={project.href ? true : undefined}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2 py-1 font-medium text-[0.6875rem] text-muted-foreground leading-none transition-colors group-hover:border-foreground/20 group-hover:bg-foreground/[0.07] group-hover:text-foreground group-focus-visible:text-foreground"
            >
              {project.href ? (
                <GitHubLogoIcon
                  aria-hidden="true"
                  className="size-3 shrink-0"
                />
              ) : (
                <LockClosedIcon
                  aria-hidden="true"
                  className="size-3 shrink-0"
                />
              )}
              {project.href
                ? new URL(project.href).pathname.split("/")[1]
                : project.label}
            </span>
          );

          return (
            <li className="py-4 first:pt-0" key={project.name}>
              <h2 className="text-[0.9375rem] text-foreground/90 leading-snug">
                {project.href ? (
                  <a
                    className="group -mx-2 -my-1 flex items-center justify-between gap-4 rounded-sm px-2 py-1 transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
                    href={project.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {projectName}
                    </span>
                    {projectBadge}
                  </a>
                ) : (
                  <span className="flex cursor-default items-center justify-between gap-4">
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {projectName}
                    </span>
                    {projectBadge}
                  </span>
                )}
              </h2>
              <div className="mt-2 flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  {project.href && project.label ? (
                    <p className="text-[0.6875rem] text-muted-foreground">
                      {project.label}
                    </p>
                  ) : null}
                  <p className="not-first:mt-1.5 text-[0.8125rem] text-foreground/80 leading-relaxed">
                    {project.description}
                  </p>
                  {project.details ? (
                    <details className="mt-2 text-[0.6875rem] text-muted-foreground">
                      <summary className="w-fit cursor-pointer rounded-sm hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">
                        {t("showcase.connectionSettings")}
                      </summary>
                      <dl className="mt-3 space-y-2 leading-relaxed">
                        {project.details.map((detail) => (
                          <div
                            className="grid gap-1 sm:grid-cols-[4.5rem_1fr] sm:gap-3"
                            key={detail.label}
                          >
                            <dt className="text-foreground/80">
                              {detail.label}
                            </dt>
                            <dd>{detail.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  ) : null}
                </div>
                {project.screenshots ? (
                  <figure
                    aria-label={t("showcase.productScreens", {
                      project: project.name,
                    })}
                    className="project-screen-fan"
                  >
                    {project.screenshots.flatMap((screenshot, index) => {
                      const variants = screenshot.darkImage
                        ? [
                            {
                              className: "dark:hidden",
                              image: screenshot.image,
                            },
                            {
                              className: "hidden dark:block",
                              image: screenshot.darkImage,
                            },
                          ]
                        : [{ className: "", image: screenshot.image }];

                      return variants.map(({ image, className }) => (
                        <a
                          aria-label={t("showcase.openScreenshot", {
                            project: project.name,
                            screen: screenshot.label,
                          })}
                          className={`project-screen ${className}`}
                          data-screen-index={index}
                          href={image.src}
                          key={image.src}
                          rel="noreferrer"
                          target="_blank"
                          title={screenshot.label}
                        >
                          <Image
                            alt={screenshot.alt}
                            className="object-cover object-left-top"
                            fill
                            sizes="160px"
                            src={image}
                          />
                        </a>
                      ));
                    })}
                  </figure>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
