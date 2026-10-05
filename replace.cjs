const fs = require('fs');
let content = fs.readFileSync('src/components/Header.astro', 'utf8');
const start = content.indexOf('<li class="has-mega-menu">');
const end = content.indexOf('<li>\n                        <button class="search-trigger"');

const replacement = `                    {menuItems.map((item: any) => (
                        <li class="has-mega-menu">
                            <a href={item.link} class={item.title === 'Products' ? 'active' : ''}>{item.title} <i class="fas fa-chevron-down" style="font-size: 0.75rem;"></i></a>
                            <div class="mega-menu">
                                <div class="mega-menu-grid" style={item.promo ? '' : 'grid-template-columns: 1fr;'}>
                                    {item.promo && (
                                        <div class="mega-menu-featured" style="background: linear-gradient(135deg, rgba(0, 159, 227, 0.1), rgba(0, 0, 0, 0.05)); border: 1px solid rgba(0, 0, 0, 0.1);">
                                            <h3>{item.promo.title}</h3>
                                            <p>{item.promo.description}</p>
                                            <a href={item.promo.buttonUrl} class="btn-small" style="background: var(--color-primary-navy);">{item.promo.buttonText}</a>
                                        </div>
                                    )}
                                    <div class="mega-menu-columns" style={item.promo ? '' : 'gap: 3rem;'}>
                                        {item.columns?.map((col: any) => (
                                            <div>
                                                <h4>{col.columnTitle}</h4>
                                                <ul>
                                                    {col.links?.map((link: any) => (
                                                        <li><a href={link.url}>{link.title}</a></li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                    `;
content = content.substring(0, start) + replacement + content.substring(end);
fs.writeFileSync('src/components/Header.astro', content);
